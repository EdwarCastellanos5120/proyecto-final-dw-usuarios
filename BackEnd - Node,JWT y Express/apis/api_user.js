var mongoose = require("mongoose");
var express = require("express");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
var router = express.Router();
var usuario = require("../models/usuarioSchema");
const bcrypt = require("bcrypt");
const configMongo = require("../config/configMongo");
const { username, password, cluster, database, options } = configMongo.mongodb;
const configToken = require("../config/configTokenJWT");
const { tk } = configToken.token;
const db_mysql = require('../config/configMYSQL');

const secret = tk;

var conexion = `mongodb+srv://${username}:${password}@${cluster}/${database}?${options}`;

const db = conexion;
mongoose
  .connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Conexion a la base de datos exitosa MONGODB Lanzado");
  })
  .catch((error) => {
    console.log("Error al conectar a la base de datos", error);
  });


db_mysql.connect((err) => {
  if (err) {
    console.log("Error al conectar a la base de datos MySQL Lanzado", err);
    return;
  } else {
    console.log("Conexion a la base de datos exitosa MySQL");
  }
});

router.post("/login", async (req, res) => {
  const { correo, clave } = req.body;
  try {
    const user = await usuario.findOne({ correo }).exec();
    if (!user) {
      res.status(401).json({ error: "Credenciales inválidas" });
      return;
    }
    const claveValida = await bcrypt.compare(clave, user.clave);
    if (!claveValida) {
      res.status(401).json({ error: "Credenciales inválidas" });
      return;
    }

    const rol = user.rol;
    const id = user._id;

    const token = jwt.sign(
      {
        correo,
        id,
        exp: Math.floor(Date.now() / 1000) + 300,
      },
      secret
    );
    res.json({ token, rol, id });
  } catch (error) {
    console.error("Error en la base de datos", error);
    res.status(500).json({ error: "Error en la base de datos" });
  }
});

function verificarToken(req, res, next) {
  const token = req.headers.authorization
    ? req.headers.authorization.split(" ")[1]
    : null;
  if (!token) {
    return res.status(403).json({ error: "Token no proporcionado" });
  }

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Token inválido" });
    }
    req.user = decoded;
    next();
  });
}

router.get("/usuarios", verificarToken, async function (req, res) {
  try {
    const usuariosMongo = await usuario.find().exec();
    const usuariosMySQL = await new Promise((resolve, reject) => {
      db_mysql.query("SELECT * FROM usuario", (err, rows) => {
        if (err) {
          console.error("Error en la consulta:", err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
    const combinedResults = usuariosMongo.map((mongoUser, index) => {
      const mysqlUser = usuariosMySQL[index];
      return {
        id: mongoUser._id,
        nombre: mongoUser.nombre,
        correo: mongoUser.correo,
        clave: mongoUser.clave,
        telefono: mysqlUser.telefono,
        direccion: mysqlUser.direccion,
        imagen: mysqlUser.imagen,
        fecha: mysqlUser.fecha_nacimiento,
        rol: mongoUser.rol,
      };
    });

    res.json(combinedResults);
  } catch (error) {
    console.error("Error en la base de datos", error);
    res.status(500).json({ error: "Error en la base de datos" });
  }
});

router.get("/usuarios/id/:id", verificarToken, async function (req, res) {
  try {
    const id = req.params.id;
    const usuarioMongo = await usuario.findById(id).exec();
    if (!usuarioMongo) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    db_mysql.query(
      `SELECT * FROM usuario WHERE id_mongo = '${id}'`,
      (err, rows) => {
        if (err) {
          console.error("Error en la consulta:", err);
          return res.status(500).json({ error: "Error en la base de datos" });
        }
        if (rows.length === 0) {
          return res
            .status(404)
            .json({ error: "Usuario de MySQL no encontrado" });
        }

        const mysqlUser = rows[0]; // Suponemos que solo hay un usuario MySQL

        const combinedResult = {
          id: usuarioMongo._id,
          nombre: usuarioMongo.nombre,
          correo: usuarioMongo.correo,
          clave: usuarioMongo.clave,
          telefono: mysqlUser.telefono,
          direccion: mysqlUser.direccion,
          imagen: mysqlUser.imagen,
          fecha: mysqlUser.fecha_nacimiento,
          rol: usuarioMongo.rol,
        };

        res.json(combinedResult);
      }
    );
  } catch (error) {
    console.error("Error en la base de datos", error);
    res.status(500).json({ error: "Error en la base de datos" });
  }
});

router.post(
  "/usuarios/crear",
  [
    check("nombre").notEmpty().withMessage("El nombre es obligatorio"),
    check("correo").isEmail().withMessage("El correo no es válido"),
    check("clave")
      .isLength({ min: 6 })
      .withMessage("La clave debe tener al menos 6 caracteres"),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nombre, correo, clave } = req.body;

    try {
      const usuarioExistente = await usuario.findOne({ correo }).exec();
      if (usuarioExistente) {
        return res.status(400).json({ error: "El correo ya está en uso" });
      }

      const hashedClave = await bcrypt.hash(clave, 10);

      const nuevoUsuario = new usuario({
        nombre,
        correo,
        clave: hashedClave,
        rol: "Usuario",
      });
      await nuevoUsuario.save();
      res.status(201).json(nuevoUsuario);
      db_mysql.query(
        `INSERT INTO usuario (id_mongo) VALUES ('${nuevoUsuario.id.toString()}') `,
        (err, rows) => {
          if (err) {
            console.error("Error en la consulta:", err);
            return res.status(500).json({ error: "Error en la base de datos" });
          }
        }
      );
    } catch (error) {
      console.error("Error en la base de datos", error);
      res.status(500).json({ error: "Error en la base de datos" });
    }
  }
);

router.put(
  "/usuarios/actualizar/:id",
  verificarToken,
  [
    check("correo").optional().isEmail().withMessage("El correo no es válido"),
    check("clave")
      .optional()
      .isLength({ min: 6 })
      .withMessage("La clave debe tener al menos 6 caracteres"),
    check("rol").optional().notEmpty().withMessage("El rol es obligatorio"),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { nombre, correo, clave, rol, telefono, direccion, imagen, fecha } =
      req.body;
    const usuarioId = req.params.id;
    try {
      const usuarioExistente = await usuario.findById(usuarioId).exec();
      if (!usuarioExistente) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const camposActualizables = { nombre, correo, clave, rol };
      for (const campo in camposActualizables) {
        if (camposActualizables[campo] !== undefined) {
          if (campo === "clave") {
            const hashedClave = await bcrypt.hash(clave, 10);
            usuarioExistente.clave = hashedClave;
          } else {
            usuarioExistente[campo] = camposActualizables[campo];
          }
        }
      }
      db_mysql.query(
        `UPDATE usuario SET telefono='${telefono}' , direccion='${direccion}', imagen='${imagen}', fecha_nacimiento='${fecha}' WHERE id_mongo = '${usuarioId}'`,
        (err, rows) => {
          if (err) {
            console.error("Error en la consulta:", err);
            return res.status(500).json({ error: "Error en la base de datos" });
          }
        }
      );

      await usuarioExistente.save();
      res.status(200).json({ mensaje: "Usuario Actualizado correctamente" });
    } catch (error) {
      console.error("Error en la base de datos", error);
      res.status(500).json({ error: "Error en la base de datos" });
    }
  }
);

router.delete("/usuarios/eliminar/:id", verificarToken, async (req, res) => {
  const usuarioId = req.params.id;
  try {
    const usuarioEliminado = await usuario.findByIdAndRemove(usuarioId).exec();
    if (!usuarioEliminado) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    db_mysql.query(
      `DELETE FROM usuario WHERE id_mongo = '${usuarioId}'`,
      (err, rows) => {
        if (err) {
          console.error("Error en la consulta:", err);
          return res.status(500).json({ error: "Error en la base de datos" });
        }
      }
    );
    res.json({ mensaje: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("Error en la base de datos", error);
    res.status(500).json({ error: "Error en la base de datos" });
  }
});

router.put(
  "/usuarios/actualizarclave/:id",
  verificarToken,
  async (req, res) => {
    try {
      const id = req.params.id;
      const nuevaClave = req.body.clave;
      const hashedClave = await bcrypt.hash(nuevaClave, 10);
      const usuarioMongo = await usuario
        .findByIdAndUpdate(id, { clave: hashedClave }, { new: true })
        .exec();
      if (!usuarioMongo) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      res.json({ message: "Clave actualizada correctamente" });
    } catch (error) {
      console.error(
        "Error al actualizar la clave del usuario en MongoDB",
        error
      );
      res.status(500).json({ error: "Error en la base de datos" });
    }
  }
);

module.exports = router;

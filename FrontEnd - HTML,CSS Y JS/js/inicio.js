document.addEventListener("DOMContentLoaded", function () {
  fetchUserData();

  const logoutButton = document.getElementById("cerrar-sesion");
  logoutButton.addEventListener("click", function () {
    localStorage.removeItem("rol");
    localStorage.removeItem("token");
    localStorage.removeItem("id");
    window.location.href = "../index.html";
  });
});

const fetchUserData = () => {
  const rol = localStorage.getItem("rol");
  const token = localStorage.getItem("token");
  if (rol === "Administrador") {
    if (!token) {
      console.error("Token no encontrado en el localStorage.");
      return;
    }
    const apiUrl = "http://localhost:3000/api/usuarios";
    fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        generarCartasAdmin(data);
      })
      .catch((error) => {
        console.error(
          "Error al obtener datos de la API para Administradores:",
          error
        );
      });
  } else if (rol === "Usuario") {
    const userId = localStorage.getItem("id");
    if (!userId) {
      console.error("ID de usuario no encontrado en el localStorage.");
      return;
    }
    const apiUrl = `http://localhost:3000/api/usuarios/id/${userId}`;
    fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        generarCartasUser(data);
      })
      .catch((error) => {
        console.error("Error al obtener datos de la API para Usuarios:", error);
      });
  } else {
    console.error("Rol no reconocido en el localStorage.");
  }
};

const generarCartasAdmin = (data) => {
  const userCardsContainer = document.getElementById("user-cards");
  data.forEach((user) => {
    const card = buildUserCard(user);
    userCardsContainer.appendChild(card);
  });
};

const generarCartasUser = (user) => {
  const userCardsContainer = document.getElementById("user-cards");
  const card = buildUserCard(user);
  userCardsContainer.appendChild(card);
};

const buildUserCard = (user) => {
  const card = document.createElement("div");

  card.className = "container mt-3";
  card.innerHTML = `
    <div class="card">
        <div class="card-body">
            <h5 class="card-title fs-2 text-center fw-bold">Detalle de Persona Registrada</h5>
            <div class="row">
                <div class="col-md-4">
                    <img src="../${
                      user.rol || "ruta-de-imagen-por-defecto.jpg"
                    }.png" class="img-fluid" alt="Imagen de perfil" style="max-width: 250px;">
                </div>
                <div class="col-md-8">
                    <ul class="list-group list-group-flush">
                        <li class="list-group-item">
                            <strong>Nombre:</strong> 
                            <span style="color: ${
                              user.nombre ? "black" : "red"
                            }; ${
    user.nombre ? "" : "font-weight: bold; font-style: italic;"
  }">
                                ${user.nombre || "Completa el campo"}
                            </span>
                        </li>
                        <li class="list-group-item">
                            <strong>Correo:</strong> 
                            <span style="color: ${
                              user.correo ? "black" : "red"
                            }; ${
    user.correo ? "" : "font-weight: bold; font-style: italic;"
  }">
                                ${user.correo || "Completa el campo"}
                            </span>
                        </li>
                        <li class="list-group-item">
                            <strong>Teléfono:</strong> 
                            <span style="color: ${
                              user.telefono ? "black" : "red"
                            }; ${
    user.telefono ? "" : "font-weight: bold; font-style: italic;"
  }">
                                ${user.telefono || "Completa el campo"}
                            </span>
                        </li>
                        <li class="list-group-item">
                            <strong>Dirección:</strong> 
                            <span style="color: ${
                              user.direccion ? "black" : "red"
                            }; ${
    user.direccion ? "" : "font-weight: bold; font-style: italic;"
  }">
                                ${user.direccion || "Completa el campo"}
                            </span>
                        </li>
                        <li class="list-group-item">
                        <strong>Fecha de Nacimiento:</strong>
                        <span style="color: ${user.fecha ? "black" : "red"}; ${
    user.fecha ? "" : "font-weight: bold; font-style: italic;"
  }">
                            ${
                              user.fecha
                                ? new Date(user.fecha)
                                    .toISOString()
                                    .substr(8, 2) +
                                  " de " +
                                  new Date(user.fecha).toLocaleString("es-GT", {
                                    month: "long",
                                  }) +
                                  " de " +
                                  new Date(user.fecha).getFullYear()
                                : "Completa el campo"
                            }
                        </span>
                        </li>
                        <li class="list-group-item">
                            <strong>Rol:</strong> 
                            <span style="color: ${
                              user.rol ? "black" : "red"
                            }; ${
    user.rol ? "" : "font-weight: bold; font-style: italic;"
  }">
                                ${user.rol || "Completa el campo"}
                            </span>
                        </li>
                    </ul>
                    <div class="mt-3">
                    <button class="btn btn-primary edit-user-button" data-id="${
                      user.id
                    }">Editar</button>

                        <button class="btn btn-danger delete-user-button" data-id="${
                          user.id
                        }">Eliminar</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;
  return card;
};

const botonesCards = document.getElementById("user-cards");
botonesCards.addEventListener("click", (event) => {
  if (event.target.classList.contains("edit-user-button")) {
    const userUpdateId = event.target.getAttribute("data-id");
    editUser(userUpdateId);
  } else if (event.target.classList.contains("delete-user-button")) {
    const userDeleteId = event.target.getAttribute("data-id");
    deleteUser(userDeleteId);
  }
});

const editUser = (id) => {
  const token = localStorage.getItem("token");
  fetch(`http://localhost:3000/api/usuarios/id/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `Error al obtener los datos del usuario: ${response.status}`
        );
      }
      return response.json();
    })
    .then((data) => {
      $("#nombre").val(data.nombre);
      $("#correo").val(data.correo);
      $("#telefono").val(data.telefono);
      $("#direccion").val(data.direccion);
      const fechaNacimiento = new Date(data.fecha);
      const fechaFormateada = fechaNacimiento.toISOString().split("T")[0];
      $("#fechaNacimiento").val(fechaFormateada);
      $("#rol").val(data.rol);
      $("#myModal").modal("show");
      $("#saveChangesButton").on("click", () => {
        updateUser(id);
      });
    })
    .catch((error) => {
      console.error("Hubo un error al obtener los datos del usuario:", error);
    });
};

const updateUser = (id) => {
  const token = localStorage.getItem("token");
  const nombre = $("#nombre").val();
  const correo = $("#correo").val();
  const telefono = $("#telefono").val();
  const direccion = $("#direccion").val();
  const fechaNacimiento = $("#fechaNacimiento").val();
  const rol = $("#rol").val();
  const userData = {
    nombre,
    correo,
    telefono,
    direccion,
    fecha: fechaNacimiento,
    rol,
    imagen: rol,
  };
  fetch(`http://localhost:3000/api/usuarios/actualizar/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error al actualizar el usuario: ${response.status}`);
      }
      return response.json();
    })
    .then(() => {
      $("#myModal").modal("hide");
      window.location.reload();
    })
    .catch((error) => {
      console.error("Hubo un error al actualizar el usuario:", error);
    });
};

const deleteUser = (id) => {
  $("#confirmationModal").modal("show");
  $("#confirmDeleteButton").on("click", function () {
    const token = localStorage.getItem("token");
    fetch(`http://localhost:3000/api/usuarios/eliminar/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error al eliminar el usuario: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        $("#confirmationModal").modal("hide");
        window.location.reload();
      })
      .catch((error) => {
        console.error("Hubo un error al eliminar el usuario:", error);
        $("#confirmationModal").modal("hide");
      });
  });
};

const cambiarclave = document.getElementById("cambiar-clave");
cambiarclave.addEventListener("click", function () {
  $("#cambiarClaveModal").modal("show");
  $("#cambiarClaveForm").submit(function (event) {
    event.preventDefault();
    const newPassword = $("#nuevaClave").val();
    const confirmPassword = $("#confirmarClave").val();
    if (newPassword === confirmPassword) {
      $("#alerta-clave-no-coincide").hide();
      updatePassword(newPassword);
    } else {
      $("#alerta-clave-no-coincide").show();
    }
  });
});

const updatePassword = (newPassword) => {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("id");
  
  const userData = {
    clave: newPassword,
  };

  fetch(`http://localhost:3000/api/usuarios/actualizarclave/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error al actualizar la contraseña: ${response.status}`);
      }
      return response.json();
    })
    .then(() => {
      $("#cambiarClaveModal").modal("hide");
      window.location.reload();
    })
    .catch((error) => {
      console.error("Hubo un error al actualizar la contraseña:", error);
    });
};


document.addEventListener("DOMContentLoaded", function () { 
    document.getElementById("registro").addEventListener("click", function () {
        const nombre = document.getElementById("nombre").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const data = {
            nombre: nombre,
            correo: email,
            clave: password,
        };
        fetch("http://localhost:3000/api/usuarios/crear", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          })
            .then((response) => response.json())
            .then((data) => {
                window.location.href = "../index.html";
            })
            .catch((error) => {
              console.error("Error:", error);
            });

      });
});
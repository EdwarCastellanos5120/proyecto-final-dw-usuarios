document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("iniciar-sesion")
    .addEventListener("click", function () {
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const data = {
        correo: email,
        clave: password,
      };

      fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error("Credenciales inválidas");
          }
        })
        .then((data) => {
          localStorage.setItem("token", data.token);
          localStorage.setItem("rol", data.rol);
          localStorage.setItem("id", data.id);
          window.location.href = "../pages/inicio.html";
        })
        .catch((error) => {
          console.error("Error:", error);
          const alertaDiv = document.getElementById("alerta");
          alertaDiv.innerHTML =
            '<div class="alert alert-danger" role="alert">Credenciales inválidas. Por favor, inténtelo de nuevo.</div>';
        });
    });
});

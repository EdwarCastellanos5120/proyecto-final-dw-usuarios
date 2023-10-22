const express = require('express');
const api = require('./apis/api_user');
const port = 3000;
const app = express();
const cors = require("cors");
app.use(cors());

app.listen(port, function () {
    console.log('Servicio Desplegado en el Puerto - > ' + port);
});
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use('/api', api);
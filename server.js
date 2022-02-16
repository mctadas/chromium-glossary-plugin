const mockedData = require("./data/telia-glossary.json");
const express = require("express");
const app = express();  //Create new instance
const PORT =  8081; 
app.use(express.json()); 
//Define the endpoint

app.get("/glossory", (req, res) => {  
    console.log("Glossory sent")
  return res.send(mockedData);
});

app.listen(PORT, () => {
  console.log("Server started listening on port : ", PORT);
});
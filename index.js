const express = require('express');
const app = express();

app.get("/", (req,res) =>{
	res.send({deploy:'your site'})
});

const PORT = process.env.PORT || 3000;
app.listen(PORT);
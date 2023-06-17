const express = require('express');
const app = express();
const port = 4500;
const path = require('path');


app.use('/assets',express.static(path.resolve(__dirname,'..')+'/dist/assets'));

app.get('/',(req, res)=>{
    res.status(200).sendFile(path.resolve(__dirname,'..')+'/dist/index.html');
});

/* app.all('*',(req, res)=>{
    res.status(404);
}) */

app.listen(port,()=>{
    console.log("Runining at port: "+port);
});
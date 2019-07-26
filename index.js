const express = require('express')
const app = express();

app.get('/', (req, res) => {
    res.sendfile('views/snake.html');
});

app.listen(8000, () => {
    console.log('Example app listening on port 8000!')
});
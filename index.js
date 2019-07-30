const express = require('express')
const app = express();

// app.get('/', (req, res) => {
//     res.sendfile('views/index.html');
// });
app.use('/', express.static('public'));
app.listen(8000, () => {
    console.log('Example app listening on port 8000!')
});

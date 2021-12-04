//make sure to use HTTPs
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { exec } = require('child_process');
const app = express();
const port = process.env.PORT || 80;
let inUse = false;
require('dotenv').config();
// let options = {
// 	key: fs.readFileSync('./star_itp_io.key'),
// 	cert: fs.readFileSync('./star_itp_io.pem')
// }
const http = require('http');
const httpServer = http.createServer(app);
const socket = require('socket.io')(httpServer);
let pythonPath = __dirname.split("\\")
console.log(pythonPath);
pythonPath.splice(-2, 2);
console.log(pythonPath)
let scriptPath = __dirname.split('\\')
scriptPath.splice(-2, 2);
pythonPath.push('python', 'main.py');
scriptPath.push('python', 'Scripts', 'python.exe');
scriptPath = scriptPath.join('\/');
console.log('script path:' + scriptPath)
pythonPath = pythonPath.join('\/');
console.log('python path:' + pythonPath)
let pagePath = __dirname.split('\\');
pagePath.splice(-1, 1);

pagePath.push('client', 'build', 'index.html');
let htmlPath = pagePath.join('\/');
pagePath.splice(-1, 1);
let dirPath = pagePath.join('\/');
console.log(dirPath)
app.use(bodyParser.json());
app.use(express.static(dirPath));
app.get('/', (req, res) => {
  res.sendFile(htmlPath)
})
app.use(bodyParser.urlencoded({ extended: true }));
//Following part should be hooked up with the pi, once it is set
app.get('/system/role/admin/turntablestatus', async (req, res) => {

})
app.get('/system/role/user/APIKEY', (req, res) => {
  console.log(process.env.NASA_API_KEY);
  res.send(JSON.stringify({ key: process.env.NASA_API_KEY }));
})
app.post('/system/role', (req, res) => {
  let validation = req.body;
  console.log(req.body)
  fs.readFile('./server/users.json', async (err, data) => {
    if (err) console.log(err);
    let userList = JSON.parse(data.toString('utf-8'));
    for (let user of userList) {
      if (user['username'] == validation['username'] && user['password'] == validation['password']) {
        res.send(true);
        console.log('admin successfully login')
      } else {
        res.send(false)
      }
    }
  })
})

app.post('/system/role/user/active', (req, res) => {

})

app.post('/system/role/admin/turntable/azimuth', (req, res) => {
  let updatedAz = req.body['az'];
  updatedAz = Number(updatedAz);
  if (updatedAz > 0 && updatedAz < 360) {
    res.send('updated');
    console.log('send to pi')
  } else {
    res.send(false);
    console.log('access denied')
  }
});

app.post('/system/role/admin/turntable/altitude', (req, res) => {
  let updatedAl = req.body['al'];
  updatedAl = Number(updatedAl);
  if (updatedAl > 0 && updatedAl < 360) {
    res.send('updated');
    console.log('send to pi')
  } else {
    res.send(false);
    console.log('access denied')
  }
})

app.post('/system/role/user/inactive/entity', async (req, res) => {
  const requestBundle = req.body;
  let startTime = requestBundle['startTime'];
  let endTime = requestBundle['endTime'];
  if (validator(startTime, endTime)) {
    startTime = dateFormatter(startTime);
    endTime = dateFormatter(endTime);
    console.log(startTime)
    const timeLapse = 1;
    let temp = {};
    // request from python
    exec(`${scriptPath} ${pythonPath} ${requestBundle.name} ${requestBundle.lat} ${requestBundle.long} ${startTime}`, (err, stdout, stderr) => {
      if (err) {
        console.log(err);
        res.send(false);
      }
      if (stdout) {
        inUse = true;
        //return is a string
        console.log(stdout);
        let result = stdout.split(' ');
        let az = result[0];
        let alt = result[1];
        // console.log(result);
        let azDay = getDay(az);
        let altDay = getDay(alt);
        let azMin = getMinute(az);
        let altMin = getMinute(alt);
        const azAlt = {
          "az": azDay + '.' + azMin,
          "alt": altDay + '.' + altMin
        }
        socket.emit('location', azAlt)
        res.send('found');
      }
      if (stderr) {
        console.log(stderr)
      }
    })
  }else{
    console.log('Time input not valid')
    res.send('invalid time');
  }
})
httpServer.listen(port, () => console.log(`Listening on port ${port}`));
socket.on('connection', (msg) => {
  console.log('Connection!');
  socket.emit('update', 'hell from the server!');
})

function getDay(str) {
  let dayPattern = /(\d+d)/;
  let res = dayPattern.exec(str)[0]
  return res.slice(0, -1);
}
function getMinute(str) {
  let minutePattern = /(\d+m)/;
  let res = minutePattern.exec(str)[0];
  return res.slice(0, -1);
}
function getPythonEXEPath() {

}

function getPythonScriptPath() {

}

function getStaticFolderPath() {

}

function getEntryFilePath() {

}

function dateFormatter(time) {
  let date = new Date();
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}T${time}`;
}
//input as string, need to validate the start time is ealier than endtime
function validator(start, end) {
  const startArray = start.split(':');
  const endArray = end.split(':');
  console.log(startArray, endArray);
  if (startArray[0] > endArray[0]) {
    return false;
  } else if (startArray[0] === endArray[0] && startArray[1] > endArray[1]) {
    return false;
  }
  return true;
}

function timer(start, end){

}
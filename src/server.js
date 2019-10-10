const mysql = require('mysql');
const express = require('express');
const multer = require('multer');
const path = require("path");
const bodyParser = require('body-parser');
const fs = require('fs');
const AWS = require('aws-sdk');
require('dotenv').config();
// ------------  Connection constants  -------------
const buildPath = path.join(__dirname, '../build');
const buildUploadPath = path.join(buildPath, 'uploads');
!fs.existsSync(buildUploadPath) && fs.mkdirSync(buildUploadPath);
const app = express();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, buildUploadPath)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage}).single('file');
const connection = mysql.createConnection({
  host: 'fabriqate.crl4trwjgvso.eu-west-2.rds.amazonaws.com',
  port: '3306',
  user: 'fabriqate',
  password: process.env.DBPASSWORD,
  database: 'fabriqate',
});

const PORT = process.env.PORT || 3000;
const s3 = new AWS.S3({
  accessKeyId: process.env.AWSACCESSID,
  secretAccessKey: process.env.AWSSECRETKEY
});

// ------------  Connection setup  -------------------
app.use(express.static(buildPath));
app.use(express.static(path.join(__dirname, 'Render_Textures')));
app.listen(PORT, function() {
  console.log('Server listening on port ' + PORT);
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

connection.connect(function (err) {
  if (err) {
    console.log("Failed to connect to database. " + err.stack);
    return;
  } console.log("Connected to database.");
});

// ------------  Connection calls ---------------------
app.get('/', function(req, res) {
  res.sendFile(path.join(buildPath, 'index.html'));
});

app.get('/login', upload, function(req,res){
  const user = req.query.username;
  connection.query("SELECT password FROM users WHERE username=" + "'" + user + "'", function (err, result) {
    if (err) {
      console.log("error in querying database:" + err);
    } else {
      if (result[0]) {
        res.status(200).send(result[0].password);
      } else {
        res.status(201).send();
      }
    }
  });
});

app.post('/signUp', upload, function(req,res) {
  const user = req.body.user;
  const pass = req.body.pass;
  // First we check that no account exists
  connection.query("SELECT * FROM users where username=" + "'" + user + "'", function (err, result) {
    if (err) {
      console.log("error in querying database:" + err);
    } else {
      if (result[0]) {
        res.status(201).send();
      } else {
        // We then create an account for them
        connection.query("INSERT INTO users (`username`, `password`) VALUES (" + "'" + user + "','" + pass + "')", function (err) {
          if (err) {
            console.log("error in querying database:" + err);
          } else {
            res.status(200).send();
          }
        });
      }
    }
  });
});

app.get('/projects', upload, function(req, res) {
  const user = req.query.username;
  connection.query("SELECT project_name FROM project WHERE users_username=" + "'" + user + "'", function (err, result) {
    if (err) {
      console.log("error in querying database:" + err);
    } else {
      if (result[0]) {
        // We send back a mapping
        const allProjects = [];
        result.forEach(project => {
          allProjects.push(project.project_name);
        });
        res.status(200).json(allProjects);
      } else {
        res.status(201).send();
      }
    }
  });
});

app.post('/newProject', upload, function (req, res) {
  const user = req.body.user;
  const projectName = req.body.projectName;
  // First we check what projects exist
  connection.query("SELECT project_name FROM project WHERE users_username=" + "'" + user + "'", function (err, result) {
    if (err) {
      console.log("error in querying database:" + err);
    } else {
      let projectExists = false;
      if (result[0]) {
         result.forEach(project => {
           if (project.project_name === projectName) {
             res.status(201).send();
             projectExists = true;
           }
         });
      }
      if (!projectExists) {
        connection.query("INSERT INTO project (`users_username`, `project_name`) VALUES(" + "'" + user + "','" + projectName + "')", function (err) {
          if (err) {
            console.log("error in querying database:" + err);
          } else {
            res.status(200).send();
          }
        });
      }
    }
  });
});

app.post('/newObject', upload, function (req, res) {
  const user = req.body.user;
  const projectName = req.body.projectName;
  let fileName = "render.obj";
  let file = null;
  let fileUrl = null;
  if (req.file) {
    fileName = req.file.filename;
    file = fs.readFileSync(path.join(buildUploadPath, fileName));
    const params = {
      Bucket: 'fabriqate',
      Key: fileName,
      Body: file,
      ACL: 'public-read'
    };
    s3.upload(params, function(err, data) {
      if (err) {
        console.log("error in uploading to bucket:" + err);
        res.status(201).send();
      }
    });
    fileUrl = "https://fabriqate.s3.amazonaws.com/" + req.file.filename;
  }

  connection.query("REPLACE INTO object (`project_users_username`, `project_project_name`, `object_name`, `object_url`) VALUES(" + "'" + user + "','" + projectName + "','" + fileName + "','" + fileUrl + "')", function(err) {
    if (err) {
      console.log("error in querying database:" + err);
      res.status(201).send();
    } else {
      res.status(200).send(fileName);
    }
  });
});

app.delete('/removeObject', function (req, res) {
  const user = req.body.user;
  const projectName = req.body.projectName;
  const objectName = req.body.objectName;
  connection.query("DELETE FROM object WHERE project_users_username=" + "'" + user + "'AND project_project_name='" + projectName + "' AND object_name='" + objectName + "'", function (err) {
    if (err) {
      console.log("error in querying database:" + err);
      res.status(201).send();
    } else {
      res.status(200).send();
    }
  })
});

app.post('/getObjects', function (req, res) {
  const user = req.body.user;
  const projectName = req.body.projectName;
  connection.query("SELECT object_name FROM object WHERE project_users_username=" + "'" + user + "' AND project_project_name='" + projectName + "'", function(err, result) {
    if (err) {
      console.log("error in querying database:" + err);
    } else if (result) {
      let allObjectNames = [];
      let allObjectPromises = [];
      let defaultObjExists = -1;
      let objCounter = 0;
      result.forEach(result => {
        if (result.object_name === "render.obj") {
          allObjectNames.push("render.obj");
          defaultObjExists = objCounter;
        } else {
          const params = {
            Bucket: 'fabriqate',
            Key: result.object_name
          };
          try {
            let promise = s3.getObject(params).promise();
            allObjectPromises.push(promise);
            allObjectNames.push(result.object_name);
          } catch (err) {
            console.log("error in querying database:" + err);
            res.status(201).send();
          }
        }
        objCounter++;
      });
      Promise.all(allObjectPromises).then(function(values) {
        let counter = 0;
        values.forEach(data => {
          if (defaultObjExists === counter) {
            counter++;
          }
          fs.writeFile(path.join(buildUploadPath,allObjectNames[counter]), data.Body.toString('utf-8'), (err) => {
            if (err) {
              console.log("error in creating locally");
              res.status(201).send();
            }
          });
          counter++;
        });
        res.status(200).send(allObjectNames);
      });
    }
  });
});

app.post('/newTexture', upload, function(req, res) {
  const user = req.body.user;
  const projectName = req.body.projectName;
  const objectName = req.body.objectName;
  const textureType = req.body.textureType;
  const textureIndex = req.body.textureIndex;
  let fileName = 'Ring_' + textureType + '.png';

  let file = null;
  if (req.file) {
    fileName = req.file.filename;
    file = fs.readFileSync(path.join(buildUploadPath, fileName));
    const params = {
      Bucket: 'fabriqate',
      Key: fileName,
      Body: file,
      ACL: 'public-read'
    };
    s3.upload(params, function(err) {
      if (err) {
        console.log("error in uploading to bucket:" + err);
        res.status(201).send();
      }
    });
  }
  connection.query("REPLACE INTO " + textureType + " (`" + textureType + "_index`, `" + textureType + "_name`, `"
    + textureType + "_original`, `object_project_users_username`, `object_project_project_name`, `object_object_name`) VALUES ("
    + "'" + textureIndex + "','" + fileName + "','" + fileName + "','" + user + "','" + projectName + "','" + objectName + "')" ,
    function (err) {
    if (err) {
      console.log("error in querying database:" + err);
      res.status(201).send();
    } else {
      res.status(200).send(fileName);
    }
  });
});

app.post('/getTextures', function(req, res) {
  const user = req.body.user;
  const projectName = req.body.projectName;
  const objectName = req.body.objectName;
  const meshIndex = req.body.meshIndex;
  const textureTypes = ['color', 'ao', 'rough', 'metal', 'normal'];
  let foundData = [];
  let callBacksRemaining = textureTypes.length;
  textureTypes.forEach(textureType => {
    let queryEnd = "'";
    if (meshIndex !== "null") {
      queryEnd = "' AND " + textureType + "_index='" + meshIndex + "'";
    }
    connection.query("SELECT * FROM " + textureType + " WHERE object_project_users_username =" + "'" + user
      + "' AND object_project_project_name ='" + projectName
      + "' AND object_object_name ='" + objectName + queryEnd , function (err, result) {
      if (err) {
        console.log("error in querying database:" + err);
      } else {
        let allTexturePromises = [];
        let allPromiseNames = [];
        result.forEach(result => {
          let textureName = null;
          let textureIndex = null;
          switch (textureType) {
            case 'color':
              textureName = result.color_name;
              textureIndex = result.color_index;
              break;
            case 'ao':
              textureName = result.ao_name;
              textureIndex = result.ao_index;
              break;
            case 'rough':
              textureName = result.rough_name;
              textureIndex = result.rough_index;
              break;
            case 'metal':
              textureName = result.metal_name;
              textureIndex = result.metal_index;
              break;
            case 'normal':
              textureName = result.normal_name;
              textureIndex = result.normal_index;
              break;
            default:
          }
          const ring_color = 'Ring_color.png';
          const ring_ao = 'Ring_ao.png';
          const ring_rough = 'Ring_rough.png';
          const ring_metal = 'Ring_metal.png';
          const ring_normal = 'Ring_normal.png';
          if (textureName !== ring_color && textureName !== ring_ao && textureName !== ring_rough
            && textureName !== ring_metal && textureName !== ring_normal) {
            const params = {
              Bucket: 'fabriqate',
              Key: textureName
            };
            const promise = s3.getObject(params).promise();
            allTexturePromises.push(promise);
            allPromiseNames.push(textureName);
          }
          foundData.push([textureName, textureIndex, textureType]);
        });
        if (allTexturePromises.length !== 0) {
          Promise.all(allTexturePromises).then(function (values) {
            let counter = 0;
            let writeCallBacksRemaining = values.length;
            values.forEach(data => {
              console.log(data);
              fs.writeFile(path.join(buildUploadPath, allPromiseNames[counter]), data.Body, (err) => {
                if (err) {
                  console.log("error in creating locally");
                  res.status(201).send();
                }
                writeCallBacksRemaining--;
                if (writeCallBacksRemaining === 0) {
                  callBacksRemaining--;
                  if (callBacksRemaining === 0) {
                    res.status(200).send(foundData);
                  }
                }
              });
              counter++;
            });
          });
        } else {
          callBacksRemaining--;
          if (callBacksRemaining === 0) {
            res.status(200).send(foundData);
          }
        }
      }
    })
  });
});
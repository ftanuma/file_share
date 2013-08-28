var http = require('http');
var formidable = require('formidable');
var fs = require('fs');

// Server settings
var hostname = 'localhost';
var port = 8080;
var uploadDir = 'uploads';

// Response to GET is handled by node-static
var static = require('node-static');
var staticFile = new(static.Server)('.', {cache: 7200});

// Make directory if it doesn't exist.
function makeDir(path){
    if (!fs.existsSync(path)){
        fs.mkdirSync(path);
        console.log('made directory: ' + path);
    }
}

// Create upload directory.
makeDir(uploadDir);

// TODO: Check the expired files and remove them.

//
// Server
//
http.createServer(function (req, res){
    if(req.method === 'GET'){
        staticFile.serve(req, res, function (err, response) {
            if (err) {
                console.error("> Couldn't serve following file: "
                              + req.url
                              + ' - '
                              + err.message);
                if(err.status === 404) {
                    staticFile.serveFile('error.html', 404, {}, req, res);
                }
                else{
                    res.writeHead(err.status, err.headers);
                    res.end();
                }
            } else {
                console.log('> Served: ' + req.url + ' - ' + response.message);
            }
        });
    }
    else if(req.method === 'POST'){
        //
        // POST is handled using formidable.
        //
	    var form = new formidable.IncomingForm();
	    form.uploadDir = uploadDir;
	    form.on('file', function (field, file) {
            console.log('field: ' + field);
	        if(!file.size){
                console.log('file size is invalid');
		        return;
	        }

            var url = 'http://'
                    + hostname + ':' + port + '/'
                    + file.path;

            res.write('<html><body>');
	        res.write(file.name + ' is uploaded.<br>');
            res.write('Download URL is: '
                      + '<a href="' + url + '">'
                      + url
                      + '</a><br>'
                     );
            res.write('</html></body>');
	    }).on('fileBegin', function(field, file){
	        if(file.name){
                var dirPath = file.path;
                makeDir(dirPath);
		        file.path = dirPath + '/' + file.name;
	        }
	    }).on('end', function() {
	        res.end();
	    });

	    form.parse(req);   
    }
}).listen(port, hostname);

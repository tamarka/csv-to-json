var http = require('http');
var fs = require('fs');
var formidable=require('formidable');
var streamZip = require('node-stream-zip');
var parse = require('csv-parse');

http.createServer(function (req, res) {
    var dataJson;
    if (req.url == '/fileupload') {
        var form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            var path=files.filetoupload.path;
            var zip = new streamZip({
                file: path,
                storeEntries: true
            });
            var zipEntires=zip.entries();

            zip.on('ready', () => {
                var path='./extracted';
                fs.mkdirSync('extracted');
                zip.extract(null, './extracted', (err, count) => {
                    var folderPath='./extracted';

                    fs.readdir(folderPath, (err, files) => {

                        files.forEach(file => {

                            var csvData=[];
                            var keys;
                            var arrJson=[];
                            fs.createReadStream(folderPath+"//"+file)
                                .pipe(parse({delimiter: '||'}))
                                .on('data', function(csvrow) {
                                    csvData.push(csvrow);
                                })
                                .on('end',function() {
                                    csvData.forEach(function (row, index) {
                                        var obj={};
                                        var newObj ={};

                                        if(index==0)
                                        {
                                            keys=row;
                                        }
                                        else{
                                            var values=row;
                                            keys.forEach(function (val, num) {
                                                obj[val]=values[num];
                                            });

                                            var d=(obj.date).split("/");
                                            var date, month;
                                            ifparseInt(d[0])<10)
                                            {
                                                date="0"+d[0];
                                            }
                                            else {
                                                date=d[0];
                                            }
                                            if(parseInt(d[1])<10)
                                            {
                                                month="0"+d[1];
                                            }
                                            else {
                                                month=d[1];
                                            }
                                            var year=d[2];
                                            var newDate=year+"-"+month+"-"+date;
                                            newObj.name = obj.first_name + obj.last_name;
                                            newObj.phone= ((obj.phone).match(/\d/g)).join("");
                                            newObj.person = {"firstName":{"type": typeof obj.first_name}, "lastName": {"type": typeof obj.last_name}};
                                            newObj.amount=obj.amount;
                                            newObj.date=newDate;
                                            newObj.costCenterNum=((obj.cc).match(/\d/g)).join("");



                                            arrJson.push(newObj);
                                        }
                                    });
                                    //fs.writeFile('json/1.json', JSON.stringify(arrJson, null, 4));
                                    res.writeHead(200, {'Content-Type': 'text/html'});
                                    res.write(JSON.stringify(arrJson, null, 4));
                                    res.end();

                                });
                        });
                    })
                    zip.close();
                });
            });


// Handle errors
            zip.on('error', err => { console.log(err) });

        });
    } else {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
        res.write('<input type="file" name="filetoupload">');
        res.write('<input type="submit">');
        res.write('</form>');
        return res.end();
    }
}).listen(8080);

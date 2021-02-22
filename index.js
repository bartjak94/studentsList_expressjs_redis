const express = require('express')
const app = express()
var bodyParser = require('body-parser');

var urlencodedParser = bodyParser.urlencoded({extended: false})
app.use(express.static('public'));

const Redis = require("ioredis");
const redis = new Redis();


var powtarza_sie = 0;
var indeksy = [];
var powrot = '<br><a href="/">Powrot do strony glownej</a>';
var dodaj_studenta = '<a href="/dodaj_studenta">Dodaj studenta</a>';
var wyswietl_studentow = '<a href="/wyswietl_studentow">Lista studentow</a>'


function refresh() {
    redis.keys('*',function (err,result) {
        for(var i in result)
        {
            for(var j in indeksy)
                {
                    if(i==j)
                    {
                        powtarza_sie = 1;
                    }
                }
                if(powtarza_sie!=1)
                {
                    indeksy.push(result[i]);
                }
                powtarza_sie = 0;
        }
    });
}



function findEmptyIndex() {
    var a;
    if(indeksy.length > 0)
    i = Math.max.apply(null, indeksy);
    else
    i=0;

        if(i>10)
        {
            if(i>100)
            {
                a = i+1;
            } else {
                a = "0" + (i+1);
            }
        } else {
            a = "00" + (i+1);
        }
    
    return a;

}

function compareNumbers(a,b) {
    return a - b;
}


app.get('/', function (req, res) {
    refresh();
     res.send(dodaj_studenta + "<br>" + wyswietl_studentow);
})




app.get('/dodaj_studenta', function (req, res) {
    var nazwa_pola1 = "Imie";
    var nazwa_pola2 = "Nazwisko";
    var form = `
    <form action="/dodajstudenta" method="GET">
        ${nazwa_pola1}: <input type="text" name="imie"><br>
        ${nazwa_pola2}: <input type="text" name="nazwisko"><br>
        <input type="submit" value="Dodaj osobe">
        </form>
    `;
    res.send(form);
})
 

app.get('/dodajstudenta', function (req, res) {

    var keyname = findEmptyIndex();

redis.hmset(keyname, 'imie', req.query.imie, 'nazwisko', req.query.nazwisko, function(err,data) {
    if(err) {
        console.log(err);
        res.end("Blad dodania obiektu do bazy");
    }
    if(data==1) {
        indeksy.push(keyname);
        res.send('Student zostal dodany do bazy. <a href="/">Powrot do strony glownej</a>');
    } else if(data==0) {
        res.send('Student NIE zostal dodany do bazy.<a href="/">Powrot do strony glownej</a>');
        }
        else {
            indeksy.push(keyname);
            //data nigdy nie zwraca 0 ani 1 (inaczej niz w przypadku wykladu), zwrot == „OK”
            res.send(`
            Dodano studenta o indeksie ${keyname}!
            ` + powrot);
        }
    });
});

app.get('/wyswietl_studenta', function(req, res) {
redis.hgetall(req.query.indeks, function(err, data) {
var hash = "<ul>";
for(var key in data) {
    if(data.hasOwnProperty(key)) {
        hash += "<li>" + key + ":  " + data[key] + "</li>";
    }
}
hash += "</li>";
res.send(`Dane studenta ` + req.query.indeks + ":<br>" + hash + wyswietl_studentow + powrot);
})
})



app.get('/usun_studenta', function(req, res) {
    redis.del(req.query.indeks, function(err, data) {
        if(err)
        {
            console.log(err);
            res.end("Blad bazy");
        }
        const i = indeksy.indexOf(req.query.indeks);
        indeksy.splice(i, 1);
        res.send(`Udalo sie usunac studenta numer ${req.query.indeks}` + powrot);
    });
})


app.get('/wyswietl_studentow', function(req,res) {
    refresh();
    var hash = `
    <ul> Lista studentów:
    `;

    indeksy.sort(compareNumbers);

    for(var j = 0; j < indeksy.length; j++)
    {
        var url = encodeURIComponent(indeksy[j]);
        hash += `<li> <a href="wyswietl_studenta?indeks=${url}">` + indeksy[j] + `</a> <a href="usun_studenta?indeks=${url}">Usuń</a> </li>`;  
    }
    res.send(hash + powrot);
});




app.listen(3000);
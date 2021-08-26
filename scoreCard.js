let request = require("request");
let cheerio = require("cheerio");
let fs = require("fs");
let path = require("path");
let xlsx = require("xlsx");
function callbackforEachMatch(error , response , html){
    if(error){
        console.log("error:",error);
    } else if(response.statusCode == 404){
        console.log("Page Not Found!");
    } else {
      
        getDataFromEachMatch(html);
    }
}

function getDataFromEachMatch(html){
    let searchTool = cheerio.load(html);
    let currpath = process.cwd();
    let folder = path.join(currpath ,"crickinfo");
    if(fs.existsSync(folder) == false){
        fs.mkdirSync(folder);
    }
    folder = path.join(folder,"ipl");
    if(fs.existsSync(folder) == false){
        fs.mkdirSync(folder);
    }
    let divs = searchTool(".match-info.match-info-MATCH.match-info-MATCH-half-width .teams");
    searchTool = cheerio.load(divs.html());
    let firstteamdetails = searchTool(divs.children().first());
    
    let secondteamdetails = searchTool(divs.children().last());
    
    //first team

    searchTool = cheerio.load(firstteamdetails.html());
    let first_team_name = searchTool(".name").text();
   // console.log("firstteam:",first_team_name);
    //second team

    searchTool = cheerio.load(secondteamdetails.html());
    let sec_team_name= searchTool(".name").text();
    //console.log("opp. team:",sec_team_name);
   
    let teamname = path.join(folder,first_team_name);
    if(fs.existsSync(teamname) == false){
        fs.mkdirSync(teamname);
    } 

    searchTool = cheerio.load(html);
    let fulltable = searchTool(".match-scorecard-page");
    searchTool  = cheerio.load(fulltable.html());
    let first_batting_table =  searchTool(fulltable.children().first()).html();
    searchTool = cheerio.load(first_batting_table);
    let battingtable = searchTool(".batsman-cell.text-truncate.out"); 
    
   // console.log(battingtable.length);
    //console.log(battingtable.text());
   
     
    let trows = searchTool('td');
   
    let line = 0;
   
    let folder_path = teamname;
    searchTool = cheerio.load(html);
    let matchdetails = searchTool(".match-info.match-info-MATCH.match-info-MATCH-half-width .description");
    matchdetails = matchdetails.text().split(",");
    //console.log("matchdetails:",matchdetails);
    let resultt = searchTool(".match-info.match-info-MATCH.match-info-MATCH-half-width .status-text").text();

    console.log("`````````````````````````````````````````````````````````````````````````````````````````````");
    console.log(`${first_team_name} VS ${sec_team_name} Result -> ${resultt} ${matchdetails[1]} ${matchdetails[2]} `);
    let playerpath = "";
    let cnt = 0;
    let myTeamName,myOpponentTeam , name,result,venue,matchdate,runs,balls,fours,sixes,sr;
    for(let i =0 ; i< trows.length ; i++){
        line = line % 9;
        let value = (searchTool(trows[i]).text());

       
         if(value == "Extras"){
            break;
        } else if(line == 0){
         
         //intizing object
          myTeamName = first_team_name;
          name = value;
          myOpponentTeam = sec_team_name;
          result = resultt;
          venue = matchdetails[1];
          matchdate = matchdetails[2];

        } else if(line == 1){
            //player_obj["runs"] = value;
        } else if(line == 2){
            runs = value;
        } else if(line == 3){
            balls = value;                   // nothing to do with line=4
        } else if(line  == 5){
           fours = value;
        } else if(line  == 6){
            sixes = value;
        } else if(line  == 7){
             sr = value;
        } else if(line == 8){
           
            console.log(`${name} | ${runs} | ${balls} | ${fours} | ${sixes} | ${sr}`);
            makejsonFiles(myTeamName , name , venue ,matchdate , myOpponentTeam , result , runs , balls , fours , sixes , sr , folder_path);
           
         }
       
        line++;
    }
    console.log("`````````````````````````````````````````````````````````````````````````````````````````````\n\n");
}

function makejsonFiles(myTeam, playerName, venue, date, opponentTeam, result, runs, balls, fours, sixes ,sr,folder_path){
    
    let playerNamePath = path.join(folder_path,playerName + ".json");
    let contentinArr = [];
    let matchObject = {
        myTeam, playerName, venue, date, opponentTeam, result, runs, balls, fours , sixes,sr
    }
    contentinArr.push(matchObject);
    if(fs.existsSync(playerNamePath)){
        let data = fs.readFileSync(playerNamePath);
        contentinArr = JSON.parse(data);
    }
    contentinArr.push(matchObject);
    fs.writeFileSync(playerNamePath, JSON.stringify(contentinArr));
    
    // now for excel files
    let excelFilepath = path.join(folder_path ,"excelFiles" );
    dirCreator(excelFilepath);
    excelFilepath = path.join(excelFilepath ,playerName + ".xlsx");
    
    let content = excelReader(excelFilepath ,playerName);
    content.push(matchObject);
    excelWriter(excelFilepath , content ,playerName);

 }
function dirCreator(filepath){
    if(fs.existsSync(filepath) == false){
        fs.mkdirSync(filepath);
    }
}

function excelWriter(filepath , jsonData , sheetname){
    let newWB = xlsx.utils.book_new();
    let newWs = xlsx.utils.json_to_sheet(jsonData);
    xlsx.utils.book_append_sheet(newWB , newWs , sheetname);
    xlsx.writeFile(newWB , filepath);
}

function excelReader(filepath , sheetname){
    if(fs.existsSync(filepath) == false){
        return [];
    }
    let wb = xlsx.readFile(filepath);
    let excelData = wb.Sheets[sheetname];
    let ans = xlsx.utils.sheet_to_json(excelData);
    return ans;
}
 module.exports = {
    callbackforEachMatch
 }
let cheerio = require("cheerio");
let request = require("request");
let path = require("path");
let fs = require("fs");


let url = "https://www.espncricinfo.com/series/ipl-2020-21-1210595";

request(url ,cb);

function cb(error , response , html){
    if(error){
        console.log("error:",error);
    } else if(response.statusCode == 404){
        console.log("Page Not Found!");
    } else {
        gotoMainPage(html);
    }
}

function gotoMainPage(html){
    let searchTool = cheerio.load(html);
    let viewall_link = searchTool(".label.blue-text.blue-on-hover");
    let link = viewall_link.attr("href");
    // console.log(link);
   
   
    let full_link = `https://www.espncricinfo.com${link}`;
    console.log(full_link);
    request(full_link,all_Match_Page);
}


function all_Match_Page(error , response , html){
    if(error){
        console.log("error:",error);
    } else if(response.statusCode == 404){
        console.log("Page Not Found!");
    } else {
        allScoreCards(html);
    }
}
let fullscorecardlinks = []
function allScoreCards(html){
    let searchTool = cheerio.load(html);
    let all_links = searchTool("a.match-info-link-FIXTURES");
     console.log(all_links.length);
     //to avoid duplicate links
        let previouslink = searchTool(all_links[0]).attr("href");
        let pfull_link  =  `https://www.espncricinfo.com${previouslink}`;
        fullscorecardlinks.push(pfull_link);

    for(let i = 1; i<= all_links.length ; i++){
       let matchlink = searchTool(all_links[i]).attr("href"); 
    if(matchlink != previouslink && matchlink != undefined){
        let match_full_link = `https://www.espncricinfo.com${matchlink}`;
        fullscorecardlinks.push(match_full_link);
        previouslink = matchlink;
        // console.log("links: ",i,match_full_link);
    }
     

    }
    //console.log(fullscorecardlinks.length);
    // console.log(fullscorecardlinks);
    
    // visit links
    console.log("line68");
    visitLinks(fullscorecardlinks);
    
}

function visitLinks(fullscorecardlinks){
    console.log(fullscorecardlinks.length);
    for(let i = 0 ; i < fullscorecardlinks.length ; i++){
        // console.log(i,fullscorecardlinks[i]);
        let link = fullscorecardlinks[i];
        request(link , callbackforEachMatch);
    }
}

function callbackforEachMatch(error , response , html){
    if(error){
        console.log("error:",error);
    } else if(response.statusCode == 404){
        console.log("Page Not Found!");
    } else {
        console.log("calling: get data from each match!")
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
    console.log("firstteam:",first_team_name);
    //second team

    searchTool = cheerio.load(secondteamdetails.html());
    let sec_team_name= searchTool(".name").text();
    console.log("opp. team:",sec_team_name);
    // console.log(typeof firstteamdetails);


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
    // searchTool = cheerio.load(battingtable);
    // console.log(battingtable.html());
    console.log(battingtable.length);
    console.log(battingtable.text());
   
     
    let trows = searchTool('td');
   
    
   
    
    let line = 0;
    
    let player_data = [];
    let player_obj = {};
    let folder_path = teamname;
    searchTool = cheerio.load(html);
    let matchdetails = searchTool(".match-info.match-info-MATCH.match-info-MATCH-half-width .description");
    matchdetails = matchdetails.text().split(",");
    console.log("matcghdetails:",matchdetails);
    let result = searchTool(".match-info.match-info-MATCH.match-info-MATCH-half-width .status-text").text();
    console.log("result:",result);
    let playerpath = "";
    let cnt = 0;
    for(let i =0 ; i< trows.length ; i++){
        line = line % 9;
        let value = (searchTool(trows[i]).text());
       // console.log("line:",line,":",value);
       
         if(value == "Extras"){
            break;
        } else if(line == 0){
         
         // initializing object
         player_obj["name"] = value;
         player_obj["myTeamName"] = first_team_name;
         player_obj["myOpponentTeam"] = sec_team_name;
         
         player_obj["result"] = result;
         player_obj["venue"] = matchdetails[1];
         player_obj["matchdate"] = matchdetails[2];


         //name
        
        } else if(line == 1){
            //player_obj["runs"] = value;
        } else if(line == 2){
            player_obj["runs"] = value;
        } else if(line == 3){
            player_obj["balls"] = value;                   // nothing to do with line=4
        } else if(line  == 5){
            player_obj["fours"] = value;
        } else if(line  == 6){
            player_obj["sixes"] = value;
        } else if(line  == 7){
            player_obj["strikerate"] = value;
        } else if(line == 8){
           
           // add data to json file of player
           
           player_data.push(player_obj);

           playerpath = path.join(folder_path,player_obj["name"]+".json");
          /*  if(fs.existsSync(playerpath) == false){
               fs.writeFileSync(playerpath);
               cnt++;
           } //player_obj["name"]
   */      let data = JSON.stringify(player_obj);
           console.log("data:",data);
           fs.writeFileSync(playerpath,data);
           player_obj = {};
         }
       
        line++;
    }
     
    
    console.log(player_data);
    // console.log(htmlData);


       
    }


     




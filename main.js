let cheerio = require("cheerio");
let request = require("request");
let path = require("path");
let fs = require("fs");
let scoreCardObj=require("./scoreCard")

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
    let scorecardsArr = searchTool("a[data-hover='Scorecard']");
    for(let i = 0; i < scorecardsArr.length; i++){
        let link = searchTool(scorecardsArr[i]).attr("href");
        let fullAllmatchPageLink = `https://www.espncricinfo.com${link}`;
        request(fullAllmatchPageLink , scoreCardObj.callbackforEachMatch);
    }

}



     




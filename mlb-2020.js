var games = [];

const FRANCHISES = [new Franchise("Arizona Diamondbacks","#A71930","ARI","NL","West"),new Franchise("Atlanta Braves","#13274F","ATL","NL","East"),
    new Franchise("Baltmore Orioles","#DF4601","BAL","AL","East"),new Franchise("Boston Red Sox","#BD3039","BOS","AL","East"),
    new Franchise("Chicago Cubs","#0E3386","CHC","NL","Central"),new Franchise("Chicago White Sox","#27251F","CHW","AL","Central"),
    new Franchise("Cincinnati Reds","#C6011F","CIN","NL","Central"),new Franchise("Cleveland Indians","#E31937","CLE","AL","Central"),
    new Franchise("Colorado Rockies","#33006F","COL","NL","West"),new Franchise("Detroit Tigers","#0C2340","DET","AL","Central"),
    new Franchise("Houston Astros","#EB6E1F","HOU","AL","West"),new Franchise("Kansas City Royals","#004687","KCR","AL","Central"),
    new Franchise("Los Angeles Angels","#BA0021","ANA","AL","West"),new Franchise("Los Angeles Dodgers","#005A9C","LAD","NL","West"),
    new Franchise("Miami Marlins","#00A3E0","FLA","NL","East"),new Franchise("Milwaukee Brewers","#FFC52F","MIL","NL","Central"),
    new Franchise("Minnesota Twins","#002B5C","MIN","AL","Central"),new Franchise("New York Mets","#002D72","NYM","NL","East"),
    new Franchise("New York Yankees","#0C2340","NYY","AL","East"),new Franchise("Oakland Athletics","#EFB21E","OAK","AL","West"),
    new Franchise("Philadelphia Phillies","#E81828","PHI","NL","East"),new Franchise("Pittsburgh Pirates","#FDB827","PIT","NL","Central"),
    new Franchise("San Diego Padres","#2F241D","SDP","NL","West"),new Franchise("San Francisco Giants","#FD5A1E","SFG","NL","West"),
    new Franchise("Seattle Mariners","#005C5C","SEA","AL","West"),new Franchise("St. Louis Cardinals","#C41E3A","STL","NL","Central"),
    new Franchise("Tampa Bay Rays","#8FBCE6","TBD","AL","East"),new Franchise("Texas Rangers","#003278","TEX","AL","West"),
    new Franchise("Toronto Blue Jays","#134A8E","TOR","AL","East"),new Franchise("Washington Nationals","#AB0003","WSN","NL","East")];
const DIVISIONS = [["CHW","CLE","DET","KCR","MIN"],["CHC","CIN","MIL","PIT","STL"],["BAL","BOS","NYY","TBD","TOR"],
                   ["ATL","FLA","NYM","PHI","WSN"],["HOU","ANA","OAK","SEA","TEX"],["ARI","COL","LAD","SDP","SFG"]];

$(document).ready(function(){
    $.get('https://projects.fivethirtyeight.com/mlb-api/mlb_elo_latest.csv', function (csvdata){
        for(str of csvdata.split("\n")){
            games.push(new Game(str.csvToArray()));
        }
        games.shift();
        console.log(games);
        var sn = new Season(generateTeams(FRANCHISES),games);
        sn.playSeason();
        console.log(sn);
    });
});

function Game(arr){
    this.date = arr[0][0];
    this.team1 = arr[0][4];
    this.team2 = arr[0][5];
    this.rating_prob1 = parseFloat(arr[0][20]);
    if(arr[0][24]==""){
        this.finished = false;
        this.winner = "none";
        this.loser = "none";
        this.score1 = 0;
        this.score2 = 0;
    }else{
        this.finished = true;
        this.score1 = parseFloat(arr[0][24]);
        this.score2 = parseFloat(arr[0][25]);
        if(this.score1>this.score2){
            this.winner = this.team1;
            this.loser = this.team2;
        }else{
            this.winner = this.team2;
            this.loser = this.team1;
        }
    }
    this.adjudicate = function(){
        if(Math.random()<this.rating_prob1){
            this.winner = this.team1;
            this.loser = this.team2;
        }else{
            this.winner = this.team2;
            this.loser = this.team1;
        }
        this.finished = true;
    };
    this.play = function(tm){
        if(!this.finished){
            this.adjudicate();
        }
        var div = true; //change this to make it work -- asks if game is a divisional game
        var w = this.winner;
        var l = this.loser;
        return tm.map(function(t){
            if(t.abbreviation==w){
                console.log("won");
                return t.winGame(div);
            }else if(t.abbreviation==l){
                console.log("lost");
                return t.playGame(div);
            }else{
                console.log("skipped, "+t.abbreviation+"≠ ("+w+" or "+l+")");
                return t;
            }
        });
    }
}

function Franchise(name,hex,abbrev,lg,div){
    this.name = name;
    this.abbreviation = abbrev;
    this.color = hex;
    this.league = lg;
    this.division = div;
    this.wins = [];
    this.seeds = [];
    this.opponents = [];
}

function Team(name,abbrev,lg,div){
    this.name = name;
    this.abbreviation = abbrev;
    this.league = lg;
    this.division = div;
    this.wins = 0;
    this.games = 0;
    this.divwins = 0;
    this.divgames = 0;
    this.seed = 0;
    this.opponent = "n/a";
    this.winGame = function(div){
        this.wins++;
        if(div){
            this.divwins++;
        }
        console.log("team-won");
        return this.playGame();
    };
    this.playGame = function(div){
        this.games++;
        console.log("team-played");
        if(div){
            this.divgames++;
        }
        return this;
    };
}

function Season(teams, games){
    this.teams = teams;
    this.games = games;
    this.playoffs = [];
    this.seasonPlayed = false;
    this.playSeason = function(){
        for(game of this.games){
            this.teams = game.play(this.teams);
        }
    }
}

function generateTeams(franch){
    return franch.map(x => new Team(x.name,x.abbreviation,x.league,x.division));
}

// function isDivisional(a,b) {
//     //go through all divisions and see if 2 teams occupy them
// }
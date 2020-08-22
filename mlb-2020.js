var games = [];
var sn = null; // for testing

var FRANCHISES = [new Franchise("Arizona Diamondbacks","#A71930","ARI","NL","West"),new Franchise("Atlanta Braves","#13274F","ATL","NL","East"),
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
        sn = new Season(generateTeams(FRANCHISES),games);
        sn.playSeason();
        sn.populatePlayoffs();
        console.log(sn.playoffs);
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
        var div = isDivisional(this.team1, this.team2);
        var w = this.winner;
        var l = this.loser;
        return tm.map(function(t){
            if(t.abbreviation==w){
                return t.winGame(div,l);
            }else if(t.abbreviation==l){
                return t.playGame(div,false,w);
            }else{
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
    this.wins = new Tally();
    this.seeds = new Tally();
    this.opponents = new Tally();
    this.sortTallies = function(){
      this.wins.sort();
      this.seeds.sort();
      this.opponents.sort();
    };
    this.tallySeason = function(season){
        var wins = season.teams.find(x => x.abbreviation==this.abbreviation).wins;
        var playoffs = season.teams.findIndex(x => x.abbreviation==this.abbreviation);
        if(playoffs!=1 && this.league=="NL"){playoffs-=8;}
        var opp = findOpponent(season.playoffs,playoffs, this.league);
        this.wins.add(wins);
        this.seeds.add(playoffs);
        this.opponents.add(opp);
    }
}

function Team(name,abbrev,lg,div){
    this.name = name;
    this.abbreviation = abbrev;
    this.league = lg;
    this.division = div;
    this.wins = 0;
    this.games = 0;
    this.divwins = 0;
    this.gamelog = [];
    this.divgames = 0;
    this.winGame = function(div,opp){
        this.wins++;
        if(div){
            this.divwins++;
        }
        return this.playGame(div,true,opp);
    };
    this.playGame = function(div,won,opp){
        this.games++;
        if(div){
            this.divgames++;
        }
        this.gamelog.push([opp,won]);
        return this;
    };
    this.wpct = function(){
        return this.wins/this.games;
    };
    this.dwpct = function(){
        return this.divwins/this.divgames;
    };
    this.hthwp = function(opp){
          var games = this.gamelog.filter(x => x[0]==opp);
          return games.reduce((acc, x) => x[1] ? acc + 1 : acc, 0)/games.length;
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
    };
    this.sortStandings = function(){
        this.teams.sort(playoffSort); //add more robust tiebreakers later
    };
    this.populatePlayoffs = function(){
        this.sortStandings();
        var alwest = this.teams.filter(x=> (x.division=="West" && x.league=="AL"));
        var alcent = this.teams.filter(x=> (x.division=="Central" && x.league=="AL"));
        var aleast = this.teams.filter(x=> (x.division=="East" && x.league=="AL"));
        var nlwest = this.teams.filter(x=> (x.division=="West" && x.league=="NL"));
        var nlcent = this.teams.filter(x=> (x.division=="Central" && x.league=="NL"));
        var nleast = this.teams.filter(x=> (x.division=="East" && x.league=="NL"));
        var aldivwinners = [alwest[0],alcent[0],aleast[0]].sort(playoffSort);
        var aldivrunnersup = [alwest[1],alcent[1],aleast[1]].sort(playoffSort);
        var alwildcards = [...alwest.slice(2), ...alcent.slice(2), ...aleast.slice(2)].sort(playoffSort);
        var nldivwinners = [nlwest[0],nlcent[0],nleast[0]].sort(playoffSort);
        var nldivrunnersup = [nlwest[1],nlcent[1],nleast[1]].sort(playoffSort);
        var nlwildcards = [...nlwest.slice(2), ...nlcent.slice(2), ...nleast.slice(2)].sort(playoffSort);
        this.playoffs = [...aldivwinners, ...aldivrunnersup, ...alwildcards.slice(0,2), ...nldivwinners, ...nldivrunnersup, ...nlwildcards.slice(0,2)];
    };
}

function Tally(){
    this.tally = [];
    this.count = 0;
    this.sort = function(){
      this.tally.sort((a, b) => b[1]-a[1]);
    };
    this.tallied = function(item){
        return tally.map(x => x[0]).includes(item);
    };
    this.tallyInstance = function(item){
        this.tally = this.tally.map(x => (x[0]==item) ? [x[0],x[1]+1] : x);
        this.count++;
    };
    this.addInstance = function(item){
        this.count++;
        this.tally.push([item, 1]);
    };
    this.add = function(item){
        if(this.tallied(item)){
            this.tallyInstance(item);
        }else{
            this.addInstance(item);
        }
    };
}

function generateTeams(franch){
    return franch.map(x => new Team(x.name,x.abbreviation,x.league,x.division));
}

function playoffSort(a,b){
    if(a.wpct()!=b.wpct()){
        return b.wpct()-a.wpct();
    }else if(a.hthwp(b.abbreviation)!=.5){
        return .5-a.hthwp(b.abbreviation);
    }else if(a.dwpct()!=b.dwpct()){
        return b.dwpct()-a.dwpct();
    }else{
        return Math.random()<.5;
    }
}

function isDivisional(a,b) {
    return DIVISIONS.map(x => x.reduce((acc,tm) => (tm==a || tm==b) ? acc+1 : acc, 0)).includes(2);
}

function findOpponent(playoffs,seed,league){
    var oppseed = 9-seed;
    if(league=="NL"){
        oppseed+= 8;
    }
    return playoffs[oppseed].abbreviation;
}

//tankathon!
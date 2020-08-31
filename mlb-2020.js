let FRANCHISES = [new Franchise("Arizona |Diamondbacks","#A71930","ARI","NL","West"),new Franchise("Atlanta |Braves","#13274F","ATL","NL","East"),
    new Franchise("Baltimore |Orioles","#DF4601","BAL","AL","East"),new Franchise("Boston |Red Sox","#BD3039","BOS","AL","East"),
    new Franchise("Chicago |Cubs","#0E3386","CHC","NL","Central"),new Franchise("Chicago |White Sox","#27251F","CHW","AL","Central"),
    new Franchise("Cincinnati |Reds","#C6011F","CIN","NL","Central"),new Franchise("Cleveland |Indians","#E31937","CLE","AL","Central"),
    new Franchise("Colorado |Rockies","#33006F","COL","NL","West"),new Franchise("Detroit |Tigers","#0C2340","DET","AL","Central"),
    new Franchise("Houston |Astros","#EB6E1F","HOU","AL","West"),new Franchise("Kansas City |Royals","#004687","KCR","AL","Central"),
    new Franchise("Los Angeles |Angels","#BA0021","ANA","AL","West"),new Franchise("Los Angeles |Dodgers","#005A9C","LAD","NL","West"),
    new Franchise("Miami |Marlins","#00A3E0","FLA","NL","East"),new Franchise("Milwaukee |Brewers","#FFC52F","MIL","NL","Central"),
    new Franchise("Minnesota |Twins","#002B5C","MIN","AL","Central"),new Franchise("New York |Mets","#002D72","NYM","NL","East"),
    new Franchise("New York |Yankees","#0C2340","NYY","AL","East"),new Franchise("Oakland |Athletics","#EFB21E","OAK","AL","West"),
    new Franchise("Philadelphia |Phillies","#E81828","PHI","NL","East"),new Franchise("Pittsburgh |Pirates","#FDB827","PIT","NL","Central"),
    new Franchise("San Diego |Padres","#2F241D","SDP","NL","West"),new Franchise("San Francisco |Giants","#FD5A1E","SFG","NL","West"),
    new Franchise("Seattle |Mariners","#005C5C","SEA","AL","West"),new Franchise("St. Louis |Cardinals","#C41E3A","STL","NL","Central"),
    new Franchise("Tampa Bay |Rays","#8FBCE6","TBD","AL","East"),new Franchise("Texas |Rangers","#003278","TEX","AL","West"),
    new Franchise("Toronto |Blue Jays","#134A8E","TOR","AL","East"),new Franchise("Washington |Nationals","#AB0003","WSN","NL","East")];
const DIVISIONS = [["CHW","CLE","DET","KCR","MIN"],["CHC","CIN","MIL","PIT","STL"],["BAL","BOS","NYY","TBD","TOR"],
                   ["ATL","FLA","NYM","PHI","WSN"],["HOU","ANA","OAK","SEA","TEX"],["ARI","COL","LAD","SDP","SFG"]];
const CHARTFRAMEWORK = "<table><tr><td colspan='2'><canvas id='winChart'></canvas></td></tr>" +
    "<tr><td><canvas id='seedChart'></canvas></td>" +
    "<td><canvas id='oppChart'></canvas></td></tr>" +
    "<tr><td colspan='2'><canvas id='draftChart'></canvas></td></tr></table>" +
    "<footer><a href='https://github.com/r-e-stern/baseball.outcomes/blob/master/mlb-2020.js'>Simulation code</a> &copy; 2020 R.E. Stern. " +
    "This tool uses <a href='https://github.com/fivethirtyeight/data/tree/master/mlb-elo'>FiveThirtyEight game-by-game-predictions</a>, " +
    "<a href='https://chartjs.org'>Chart.js</a>, and <a href='https://code.google.com/archive/p/csv-to-array/downloads'>csvToArray</a>.</footer>";
const LOADING = "";

let cdata;
let r;
let n;
let selfran;
let gamesloaded = false;
let lastcomplete;
Chart.defaults.global.defaultFontFamily = "'Assistant', sans-serif";
Chart.defaults.global.defaultFontSize = 14;

$(document).ready(function(){
    FRANCHISES.map(x => $("select").append("<option value='"+x.abbreviation+"'>"+x.fullname()+"</option>"));
    $.get('https://projects.fivethirtyeight.com/mlb-api/mlb_elo_latest.csv', function (csvdata){
        cdata = csvdata.split("\n").map(x => x.csvToArray()).slice(1);
        lastcomplete = cdata.find(x => x[0][24]!="");
        $("h4").html("<h4>Probabilities last updated after "
            +FRANCHISES.filter(x => x.abbreviation==lastcomplete[0][4])[0].shortname()+"-"
            +FRANCHISES.filter(x => x.abbreviation==lastcomplete[0][5])[0].shortname()
            +" game on "+lastcomplete[0][0]+"</h4>");
        $("h4").toggle().fadeIn(1500);
        gamesloaded = true;
    });
    $("button").click(function(){
        if(gamesloaded){
            runSimulation();
            $(this).off("click").click(function(){
                $("table, footer").remove();
                $("footer").remove();
                displaySimulation();
            });
        }
    });
    $(this).keypress(function(e){
        if(e.which == 13){
            $("button").click();
        }
    });
    $("select").change(function(){
        let col = findColorfromAbbrev($(this).val());
        $(this).css({"borderColor":col,
            "color":col});
        $(".lds-f div").css({"borderColor": col})
    });
});

function Game(arr){
    this.date = new Date(arr[0][0].substring(0,4),arr[0][0].substring(5,7)-1,arr[0][0].substring(8,10));
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
        let div = isDivisional(this.team1, this.team2);
        let w = this.winner;
        let l = this.loser;
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
    this.fullname = function(){
        return this.name.replace("|","")
    };
    this.shortname = function(){
        return this.name.split("|").pop();
    };
    this.color = hex;
    this.league = lg;
    this.division = div;
    this.wins = new Tally();
    this.seeds = new Tally();
    this.opponents = new Tally();
    this.opponents.sort = function(){
        this.tally.sort((a, b) => b[1]-a[1]);
    };
    this.pick = new Tally();
    this.sortTallies = function(){
      this.wins.sort();
      this.seeds.sort();
      this.opponents.sort();
      this.pick.sort();
    };
    this.tallySeason = function(season){
        let wins = season.teams.find(x => x.abbreviation==this.abbreviation).wins;
        let play = season.playoffs.findIndex(x => x.abbreviation==this.abbreviation)+1;
        let opp;
        if(play!=0){
            if(this.league=="NL"){
                play-=8;
            }
            opp = findOpponent(season.playoffs,play, this.league);
        }else{
            opp = "n/a";
        }
        let pick = season.draft.findIndex(x => x.abbreviation==this.abbreviation)+1;
        this.wins.add(wins);
        this.seeds.add(play);
        this.opponents.add(opp);
        this.pick.add(pick);
    };
    this.generateWinChart = function(n){
        let c = document.getElementById('winChart').getContext('2d');
        let winChart = new Chart(c,{
            type: 'bar',
            data: {
                labels: r.map(x => x.toString()),
                datasets: [{
                    label: "Wins",
                    data: r.map(x => this.wins.countInstance(x)/n),
                    backgroundColor: gradient("ffffff",this.color.substring(1),r.length-2),
                    borderColor: Array(r.length).fill(this.color),
                    borderWidth: 1
                }]
            },
            options: {
                scales : {
                    yAxes: [{
                        ticks: {
                            callback: function(value, index, values){
                                return (Math.round(value*10000)/100).toString() + "%";
                            }
                        }
                    }]
                },
                tooltips: {
                    custom: tt => {
                        if(tt.opacity==0){return;}
                        tt.backgroundColor = tt.labelColors[0]['borderColor'];
                    },
                    displayColors: false,
                    borderColor: "#ffffff",
                    borderWidth: 1,
                    callbacks :{
                        title : function(){},
                        label : (item, d) => "Probability of the "+selfran.shortname()+" winning " + item.xLabel + " games:",
                        labelTextColor : (item,d) => contrastText(selfran.color.replace("#","")),
                        backgroundColor: (item,d) => selfran.color,
                        afterLabel: (item, d) => (Math.round(item.yLabel*10000)/100).toString() + "%"
                    }
                    },
                aspectRatio: 9/2
            }
        });
    };
    this.generateSeedChart = function(n){
        let d = document.getElementById('seedChart').getContext('2d');
        let seedChart = new Chart(d,{
            type: 'horizontalBar',
            data: {
                labels: this.seeds.tally.map(x => x[0]==0 ? "no berth" : x[0].toString()),
                datasets: [{
                    label: "Playoff Seed",
                    data: this.seeds.tally.map(x => x[1]/n),
                    backgroundColor: Array(this.seeds.tally.length).fill(this.color),
                    borderColor: Array(this.seeds.tally.length).fill(this.color),
                    borderWidth: 1
                }]
            },
            options: {
                scales : {
                    xAxes: [{
                        ticks: {
                            callback: function(value, index, values){
                                return (Math.round(value*10000)/100).toString() + "%";
                            }
                        }
                    }]
                },
                tooltips: {
                    custom: tt => {
                        if(tt.opacity==0){return;}
                        tt.backgroundColor = tt.labelColors[0]['backgroundColor'];
                    },
                    displayColors: false,
                    borderColor: "#ffffff",
                    borderWidth: 1,
                    callbacks :{
                        title : function(item, d){},
                        label : (item, d) => item.yLabel=="no berth" ? "Probability of the "+selfran.shortname()+" missing the playoffs:" :
                            "Probability of the "+selfran.shortname()+" being the " + item.yLabel + " seed:",
                        labelTextColor : (item,d) => contrastText(selfran.color.replace("#","")),
                        backgroundColor: (item, d) => selfran.color,
                        afterLabel: (item, d) => (Math.round(item.xLabel*10000)/100).toString() + "%"
                    }
                },
                aspectRatio: 2
            }
        });
    };
    this.generateOppChart = function(n){
        let e = document.getElementById('oppChart').getContext('2d');
        let oppChart = new Chart(e,{
            type: 'horizontalBar',
            data: {
                labels: this.opponents.tally.map(x => x[0]),
                datasets: [{
                    label: "First-Round Playoff Opponent",
                    data: this.opponents.tally.map(x => x[1]/n),
                    backgroundColor: this.opponents.tally.map(x => findColorfromShortname(x[0])),
                    borderWidth: 1
                }]
            },
            options: {
                scales : {
                    xAxes: [{
                        ticks: {
                            callback: function(value, index, values){
                                return (Math.round(value*10000)/100).toString() + "%";
                            }
                        }
                    }]
                },
                tooltips: {
                    custom: tt => {
                        if(tt.opacity==0){return;}
                        tt.backgroundColor = tt.labelColors[0]['backgroundColor'];
                    },
                    displayColors: false,
                    borderColor: "#ffffff",
                    borderWidth: 1,
                    callbacks :{
                        title : function(){},
                        label : (item, d) => item.yLabel=="n/a" ? "Probability of the "+selfran.shortname()+" missing playoffs:" :
                            "Probability of the "+selfran.shortname()+" facing the " + item.yLabel + " in the first round:",
                        labelTextColor : (item,d) => contrastText(findColorfromShortname(item.yLabel).replace("#","")),
                        afterLabel: (item, d) => (Math.round(item.xLabel*10000)/100).toString() + "%"
                    }
                },
                aspectRatio: 2
            }
        });
    };
    this.generateDraftChart = function(n){
        let f = document.getElementById('draftChart').getContext('2d');
        let draftChart = new Chart(f,{
            type: 'bar',
            data: {
                labels: Array.from(new Array(29), (x, i) => (i+1).toString()),
                datasets: [{
                    label: "Draft pick",
                    data: Array.from(new Array(29), (x, i) => this.pick.countInstance(i+1)/n),
                    backgroundColor: gradient(this.color.substring(1),"ffffff",27),
                    borderColor: Array(r.length).fill(this.color),
                    borderWidth: 1
                }]
            },
            options: {
                scales : {
                    yAxes: [{
                        ticks: {
                            callback: function(value, index, values){
                                return (Math.round(value*10000)/100).toString() + "%";
                            }
                        }
                    }]
                },
                tooltips: {
                    custom: tt => {
                        if(tt.opacity==0){return;}
                        tt.backgroundColor = tt.labelColors[0]['borderColor'];
                    },
                    displayColors: false,
                    borderColor: "#ffffff",
                    borderWidth: 1,
                    callbacks :{
                        title : function(){},
                        label : (item, d) => "Probability of the "+selfran.shortname()+" picking #" + item.xLabel + " in the 2021 MLB Draft:",
                        labelTextColor : (item,d) => contrastText(selfran.color.replace("#","")),
                        afterLabel: (item, d) => (Math.round(item.yLabel*10000)/100).toString() + "%"
                    }
                },
                aspectRatio: 9/2
            }
        });
    };
    this.generateCharts = function(n){
        this.generateWinChart(n);
        this.generateSeedChart(n);
        this.generateOppChart(n);
        this.generateDraftChart(n)
    };
}

function Team(name,abbrev,lg,div){
    this.name = name;
    this.shortname = function(){
        return this.name.split("|").pop();
    };
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
          let games = this.gamelog.filter(x => x[0]==opp);
          return games.reduce((acc, x) => x[1] ? acc + 1 : acc, 0)/games.length;
    };
    this.lastn = function(n){
        this.gamelog.sort((a,b) => b[2].getTime()-a[2].getTime());
        return this.gamelog.slice(0,n).filter(x => x[1]).length;
    };
}

function Season(teams, games){
    this.teams = teams;
    this.games = games;
    this.playoffs = [];
    this.draft = [];
    this.playSeason = function(){
        for(game of this.games){
            this.teams = game.play(this.teams);
        }
    };
    this.sortStandings = function(){
        this.teams.sort(playoffSort);
    };
    this.populatePlayoffs = function(){
        this.sortStandings();
        let alwest = this.teams.filter(x=> (x.division=="West" && x.league=="AL"));
        let alcent = this.teams.filter(x=> (x.division=="Central" && x.league=="AL"));
        let aleast = this.teams.filter(x=> (x.division=="East" && x.league=="AL"));
        let nlwest = this.teams.filter(x=> (x.division=="West" && x.league=="NL"));
        let nlcent = this.teams.filter(x=> (x.division=="Central" && x.league=="NL"));
        let nleast = this.teams.filter(x=> (x.division=="East" && x.league=="NL"));
        let aldivwinners = [alwest[0],alcent[0],aleast[0]].sort(playoffSort);
        let aldivrunnersup = [alwest[1],alcent[1],aleast[1]].sort(playoffSort);
        let alwildcards = [...alwest.slice(2), ...alcent.slice(2), ...aleast.slice(2)].sort(playoffSort);
        let nldivwinners = [nlwest[0],nlcent[0],nleast[0]].sort(playoffSort);
        let nldivrunnersup = [nlwest[1],nlcent[1],nleast[1]].sort(playoffSort);
        let nlwildcards = [...nlwest.slice(2), ...nlcent.slice(2), ...nleast.slice(2)].sort(playoffSort);
        this.playoffs = [...aldivwinners, ...aldivrunnersup, ...alwildcards.slice(0,2), ...nldivwinners, ...nldivrunnersup, ...nlwildcards.slice(0,2)];
        this.draft = this.teams.reverse().filter(x => x.abbreviation!="HOU");
    };
}

function Tally(){
    this.tally = [];
    this.count = 0;
    this.sort = function(){
      this.tally.sort((a, b) => a[0]-b[0]);
    };
    this.tallied = function(item){
        return this.tally.map(x => x[0]).includes(item);
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
    this.countInstance = function(item){
        if(this.tallied(item)){
            return this.tally.filter(x => x[0]==item)[0][1];
        }else{
            return 0;
        }
    }
}

function playoffSort(a,b){
    if(a.wpct()!=b.wpct()){
        return b.wpct()-a.wpct();
    }else if(a.hthwp(b.abbreviation)!=.5){
        return .5-a.hthwp(b.abbreviation);
    }else if(a.dwpct()!=b.dwpct()){
        return b.dwpct()-a.dwpct();
    }else{
        var span = 20;
        while(span>=Math.min(a.gamelog.length,b.gamelog.length)){
            if(a.lastn(span)!=b.lastn(span)){
                return b.lastn(span)-a.lastn(span);
            }
            span++;
        }
        return Math.random()<.5;
    }
}

function isDivisional(a,b) {
    return DIVISIONS.map(x => x.reduce((acc,tm) => (tm==a || tm==b) ? acc+1 : acc, 0)).includes(2);
}

function findOpponent(playoffs,seed,league){
    let oppseed = 8-seed;
    if(league=="NL"){
        oppseed+= 8;
    }
    return playoffs[oppseed].shortname();
}

function gradient(colora, colorb, stops){
    let colora1 = parseInt(colora.substring(0,2),16);
    let colora2 = parseInt(colora.substring(2,4),16);
    let colora3 = parseInt(colora.substring(4,6),16);
    let colorb1 = parseInt(colorb.substring(0,2),16);
    let colorb2 = parseInt(colorb.substring(2,4),16);
    let colorb3 = parseInt(colorb.substring(4,6),16);
    let weight = 0;
    let r = 0;
    let g = 0;
    let b = 0;
    let color = [];
    for(let i=0; i<(2+stops); i++){
        weight = i/(1+stops);
        r = Math.floor(colorb1*weight + colora1*(1-weight)).toString(16);
        g = Math.floor(colorb2*weight + colora2*(1-weight)).toString(16);
        b = Math.floor(colorb3*weight + colora3*(1-weight)).toString(16);
        if(r.length==1){r="0"+r;}
        if(g.length==1){g="0"+g;}
        if(b.length==1){b="0"+b}
        color.push("#"+r+g+b);
    }
    return color;
}

function findColorfromShortname(sn){
    return sn=="n/a" ? "#d0d0d0" : FRANCHISES.filter(x => x.shortname()==sn)[0].color;
}

function findColorfromAbbrev(a){
    return a=="n/a" ? "#d0d0d0" : FRANCHISES.filter(x => x.abbreviation==a)[0].color;
}

function range(franch){
    let min = FRANCHISES.map(x => x.wins.tally[0][0]).reduce((a,b) => Math.min(a,b));
    let max = FRANCHISES.map(x => x.wins.tally[x.wins.tally.length-1][0]).reduce((a,b) => Math.max(a,b));
    let arr = [];
    for(let i=min; i<=max; i++){
        arr.push(i);
    }
    return arr;
}

function runSimulation(){
    n = parseInt($("input").val());
    $(".lds-f div").slideDown(500);
    for(let i=0; i<n; i++){
        setTimeout(runIteration,i);
    }
    setTimeout(()=>{
        FRANCHISES.map(x => x.sortTallies());
        r = range(FRANCHISES);
        $("span").html("has simulated "+n+" iterations");
        displaySimulation();
    },n)
}

function displaySimulation(){
    selfran = FRANCHISES.filter(x => x.abbreviation==$("select").val())[0];
    $("body").append(CHARTFRAMEWORK);
    selfran.generateCharts(n);
    $("h2").html("2020 "+selfran.fullname()+" Outcome Projections").css({"color":selfran.color});
    $("a").css({"color":selfran.color});
    $(".lds-f").remove();
}

function runIteration(){
    let sn = new Season(FRANCHISES.map(x => new Team(x.name,x.abbreviation,x.league,x.division)), cdata.map(x => new Game(x)));
    sn.playSeason();
    sn.populatePlayoffs();
    FRANCHISES.map(x => x.tallySeason(sn));
    var k = parseInt($("input").val());
    if(k>0){
        k--;
        $("input").val(k.toString());
    }
}

function contrastText(colora) {
    let r = parseInt(colora.substring(0, 2), 16);
    let g = parseInt(colora.substring(2, 4), 16);
    let b = parseInt(colora.substring(4, 6), 16);
    if((r * 0.299 + g * 0.587 + b * 0.114)>150) {
        return "#000000";
    }else{
        return "#ffffff";
    }
}
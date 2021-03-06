"use strict";


let data;

const characters = [
    "Sol", "Ky", "May", "Axl", "Chipp", 
    "Potemkin", "Faust", "Millia", "Zato", 
    "Ramlethal", "Leo", "Nagoriyuki", "Giovanna", 
    "Anji", "I-no", "Goldlewis", "Jack-O", 
    "Happy Chaos"];
const characters_short = ["SO", "KY", "MA", "AX", "CH", "PO", "FA", "MI", "ZT", "RA", "LE", "NA", "GI", "AN", "IN", "GO", "JA", "HA"];

function main() {
    fetch("./data.json")
        .then(response => { 
            return response.json();
        })
        .then(d => { 
            data = d;
            data.players = [];
            let header = document.getElementById("header");
            header.appendChild(document.createTextNode("Data from "
                + data.game_count.toLocaleString("en-US")
                + " games between "
                + data.player_count.toLocaleString("en-US")
                + " players. Data last retrieved "
                + data.timestamp + " UTC. Leaderboards require a rating deviation < 100."
            ));
            on_hash_change();

            for(let i = 0; i < data.player_files; i++) {
                let last = i == data.player_files - 1;
                fetch("./players/" + i + ".json")
                    .then(response => { 
                        return response.json();
                    })
                    .then(p => { 
                        data.players = data.players.concat(p);
                        on_hash_change();

                        if(location.hash == "#random" && last) {
                            show_random_player();
                        }
                });
            }
        });
}

//I'm pretty sure this is a "single page application"
function on_hash_change() {
    for(let i = 0; i < data.character_top_100.length; i++) {
        if(location.hash == "#top_100_" + data.character_top_100[i][0]) {
            show_top_100_character(i);
            return;
        }
    }

    if(location.hash === "") {
        show_top_100();
    } else if(location.hash === "#top_100") {
        show_top_100();
    } else if(location.hash === "#top_100_characters") {
        show_top_100_character(0);
    } else if(location.hash === "#player_search") {
        show_player_search();
    } else if(location.hash === "#random") {
        //show_random_player();
    } else if(location.hash === "#distribution") {
        show_player_distribution();
    } else if(location.hash === "#about") {
        show_about();
    } else if(location.hash === "#characters") {
        show_characters();
    } else if(location.hash === "#matchups") {
        show_matchups();
    } else {
        let id = location.hash.replace("#", "");
        show_player(id);
    }
}

function show_random_player() {
    if (data.players.length > 0) {
        let p = data.players[Math.floor(Math.random() * data.players.length)];
        location.hash = p.id;
        show_player(p.id);
    }
}

function show_top_100() {
    let div = document.getElementById("content");
    div.innerHTML = "";
    document.getElementById("about").hidden = {};
    
    let table = document.getElementById("results_table");
    table.innerHTML = "";
    {
        let row = document.createElement("tr");
        table.appendChild(row);

        append_table_header(row, "#");
        append_table_header(row, "Name");
        append_table_header(row, "Character");
        append_table_header(row, "Rating");
        append_table_header(row, "Sets played");
    }

    for(let i = 0; i < 100; i++) {
        let player = data.top_100[i];
        let row = document.createElement("tr");
        table.appendChild(row);
        append_table(row, i + 1);
        let name = append_table(row, player.name + " ");
        let link = document.createElement("a");
        link.appendChild(document.createTextNode("???"));
        link.href = "#" + player.id;
        name.appendChild(link);
        append_table(row, player.character + " ");
        append_table(row, player.rating + " ??" + player.deviation);
        append_table(row, player.set_count);
    }
}

let search_string = ""

function show_player_search() {
    let div = document.getElementById("content");
    div.innerHTML = "";
    document.getElementById("about").hidden = {};

    let table = document.getElementById("results_table");
    table.innerHTML = '';

    let input_field = document.createElement("input");
    div.appendChild(input_field);
    input_field.type = "text";
    input_field.placeholder = "GG Player";
    input_field.value = search_string;
    input_field.addEventListener("keyup", e => {
        if (e.keyCode == 13) {
            search_string = input_field.value;
            update_search_results();
        }
    });
    input_field.focus();

    let button = document.createElement("button");
    div.appendChild(button);
    button.appendChild(document.createTextNode("Search"));
    button.onclick = () => {
        search_string = input_field.value;
        update_search_results();
    }

    update_search_results();
}

function update_search_results() {
    let table = document.getElementById("results_table");
    table.innerHTML = '';
    {
        let row = document.createElement("tr");
        table.appendChild(row);

        append_table_header(row, "Name");
        append_table_header(row, "Character");
        append_table_header(row, "Rating");
        append_table_header(row, "Sets played");
        append_table_header(row, "Win rate");
    }

    if(search_string) {
        search_string = search_string.toLowerCase();
        let results = data.players.filter(p => p.all_names.some(n => n.toLowerCase().includes(search_string)));
        results.sort((a, b) => {
            let score = (n) => {
                if (n.name == search_string) {
                    return 10;
                } else if (n.name.toLowerCase() == search_string.toLowerCase()) {
                    return 9;
                } else {
                    return 0;
                }
            };
            if (score(a) > score(b)) {
                return -1;
            } else if (score(a) < score(b)) {
                return 1;
            } else {
                return b.character_stats[0].set_count - a.character_stats[0].set_count;
            }
        });
        for(let i = 0; i < results.length; i++) {

            let player = results[i];
            let stats = player.character_stats[0];
            console.log(stats);
            let row = document.createElement("tr");
            table.appendChild(row);
            let name = append_table(row, player.name + " ");
            let link = document.createElement("a");
            link.appendChild(document.createTextNode("???"));
            link.href = "#" + player.id;
            name.appendChild(link);

            append_table(row, stats.character);
            append_table(row, stats.rating + " ??" + stats.deviation);
            append_table(row, stats.set_count);
            append_table(row, Math.round(stats.win_rate * 100) + "%");
        }
    }
}

function show_characters() {
    let div = document.getElementById("content");
    div.innerHTML = "";
    document.getElementById("about").hidden = {};
    let results_table = document.getElementById("results_table");
    results_table.innerHTML = '';

    {
        let h = document.createElement("h4");
        h.appendChild(document.createTextNode("Global"));
        div.appendChild(h);
        let table = document.createElement("table");
        div.appendChild(table);
        {
            let row = document.createElement("tr");
            table.appendChild(row);
            append_table_header(row, "Character");
            append_table_header(row, "Popularity");
            append_table_header(row, "Win rate");
            append_table_header(row, "Win rate (adjusted)");
        }
        for(let i = 0; i < data.global_character_stats.length; i++) {
            let stats = data.global_character_stats[i];
            let row = document.createElement("tr");
            table.appendChild(row);
            append_table(row, stats.character);
            append_table(row, Math.round(stats.popularity * 1000) / 10 + "%");
            append_table(row, Math.round(stats.win_rate * 1000) / 10 + "%");
            append_table(row, Math.round(stats.win_rate_adjusted * 1000) / 10 + "%");
        }
    }
    div.appendChild(document.createElement("br"));
    {
        let h = document.createElement("h4");
        h.appendChild(document.createTextNode("Players rated ???1800"));
        div.appendChild(h);
        let table = document.createElement("table");
        div.appendChild(table);
        {
            let row = document.createElement("tr");
            table.appendChild(row);
            append_table_header(row, "Character");
            append_table_header(row, "Popularity");
            append_table_header(row, "Win rate");
            append_table_header(row, "Win rate (adjusted)");
        }
        for(let i = 0; i < data.high_rated_character_stats.length; i++) {
            let stats = data.high_rated_character_stats[i];
            let row = document.createElement("tr");
            table.appendChild(row);
            append_table(row, stats.character);
            append_table(row, Math.round(stats.popularity * 1000) / 10 + "%");
            append_table(row, Math.round(stats.win_rate * 1000) / 10 + "%");
            append_table(row, Math.round(stats.win_rate_adjusted * 1000) / 10 + "%");
        }
    }
}


function show_matchups() {
    let div = document.getElementById("content");
    div.innerHTML = "";
    document.getElementById("about").hidden = {};
    let results_table = document.getElementById("results_table");
    results_table.innerHTML = '';

    let show_table = (name, matchups_data)  => {
        let h = document.createElement("h4");
        h.appendChild(document.createTextNode(name));
        div.appendChild(h);
        let table = document.createElement("table");
        div.appendChild(table);
        
        let row = document.createElement("tr");
        table.appendChild(row);
        append_table_header(row, "");
        for(let i = 0; i < characters.length; i++) {
            append_table_header(row, characters_short[i]);
        }

        for(let i = 0; i < characters.length; i++) {
            let row = document.createElement("tr");
            table.appendChild(row);
            append_table_header(row, characters[i]);

            for(let j = 0; j < characters.length; j++) {
                let [rate, count] = matchups_data[i][j];
                let td = document.createElement("td");
                row.appendChild(td);
                let s = document.createElement("span");
                td.appendChild(s);
                s.appendChild(document.createTextNode(Math.round(rate * 100) + "%"));
                td.title = characters[i] + " vs " + characters[j] + ". Based on " + count + " games."
                if(count < 50) {
                    s.className = "uncertain";
                }
            }
        }
    };

    show_table("Global", data.matchups_global);
    show_table("Global (Adjusted)", data.matchups_global_adjusted);
    show_table(">1800", data.matchups_high_rated);
    show_table(">1800 (Adjusted)", data.matchups_high_rated_adjusted);
}

function show_top_100_character(id) {
    let div = document.getElementById("content");
    div.innerHTML = "";
    document.getElementById("about").hidden = {};
    let table = document.getElementById("results_table");
    table.innerHTML = '';


    for(let i = 0; i < data.character_top_100.length; i++) {
        let character = data.character_top_100[i][0];
        if(i == id) {
            div.appendChild(document.createTextNode(character));
        } else {
            let link = document.createElement("a");
            link.href = "#top_100_" + character;
            link.appendChild(document.createTextNode(character));
            div.appendChild(link);
        }
        if (i != data.character_top_100.length - 1) {
            div.appendChild(document.createTextNode(" | "));
        }
    }

    let [character, top_100] = data.character_top_100[id];
    let h = document.createElement("h2");
    h.appendChild(document.createTextNode(character));
    div.appendChild(h);

    {
        let row = document.createElement("tr");
        table.appendChild(row);
        append_table_header(row, "#");
        append_table_header(row, "Name");
        append_table_header(row, "Rating");
        append_table_header(row, "Sets played");
    }
    for(let j = 0; j < 100; j++) {
        let player = top_100[j];
        let row = document.createElement("tr");
        table.appendChild(row);
        append_table(row, j + 1);
        let name = append_table(row, player.name + " ");
        let link = document.createElement("a");
        link.appendChild(document.createTextNode("???"));
        link.href = "#" + player.id;
        name.appendChild(link);
        append_table(row, player.rating + " ??" + player.deviation);
        append_table(row, player.set_count);
    }
    div.appendChild(document.createElement("br"));
}

function show_player_distribution() {
    let div = document.getElementById("content");
    div.innerHTML = "";
    document.getElementById("about").hidden = {};
    let results_table = document.getElementById("results_table");
    results_table.innerHTML = '';

    let floor_table = document.createElement("table");
    div.appendChild(floor_table);
    {
        let row = document.createElement("tr");
        floor_table.appendChild(row);
        append_table_header(row, "Floor");
        append_table_header(row, "Players");
        append_table_header(row, "Games played");
    }
    for(let i = 0; i < data.games_per_floor.length; i++) {
        let [label, games, players] = data.games_per_floor[i];

        let row = document.createElement("tr");
        floor_table.appendChild(row);
        append_table(row, label);
        append_table(row, Math.round(players * 1000) / 10 + "%");
        append_table(row, Math.round(games * 1000) / 10 + "%");
    }

    div.appendChild(document.createElement("br"));

    let ratings_table = document.createElement("table");
    div.appendChild(ratings_table);
    {
        let row = document.createElement("tr");
        ratings_table.appendChild(row);
        append_table_header(row, "Rating");
        append_table_header(row, "Players");
        append_table_header(row, "Percentile");
        append_table_header(row, "Games played");
    }
    for(let i = 0; i < data.games_per_rating.length; i++) {
        let [label, games, players, players_cum] = data.games_per_rating[i];
        if(games < 0.001) {
            continue;
        }
        let row = document.createElement("tr");
        ratings_table.appendChild(row);
        append_table(row, label);
        append_table(row, Math.round(players * 1000) / 10 + "%");
        append_table(row, Math.round(players_cum * 1000) / 10 + "%");
        append_table(row, Math.round(games * 1000) / 10 + "%");
    }
}

function show_about() {
    let div = document.getElementById("content");
    div.innerHTML = '';
    let results_table = document.getElementById("results_table");
    results_table.innerHTML = '';
    document.getElementById("about").hidden = undefined;
}

function show_player(id) {
    let player = data.players.find(p => p.id == id);
    if(player) {
        let div = document.getElementById("content");
        div.innerHTML = "";
        document.getElementById("about").hidden = {};

        let rank_table = document.getElementById("results_table");
        rank_table.innerHTML = '';

        let h = document.createElement("h2");
        div.appendChild(h);
        h.appendChild(document.createTextNode(player.name));
        let other_names = player.all_names.filter(n => n != player.name);

        if(other_names.length > 0) {
            append_p(div, "Other names: " + other_names);
        }

        for(let i = 0; i < player.character_stats.length; i++) {
            let stats = player.character_stats[i];
            {
                let h = document.createElement("h4");
                div.appendChild(h);
                h.appendChild(document.createTextNode(
                    stats.character
                        + " - "
                        + stats.rating
                        + " ??"
                        + stats.deviation
                        + " (" + stats.set_count + " sets, "
                        + Math.round(stats.win_rate * 100)
                        + "% win rate)"
                ));
            }
            {
                let history = stats.match_history;
                let table = document.createElement("table");
                div.appendChild(table);
                append_table_header(table, "Date");
                append_table_header(table, "Rating");
                append_table_header(table, "Floor");
                append_table_header(table, "Opponent");
                append_table_header(table, "Opp. Character");
                append_table_header(table, "Opp. Rating");
                append_table_header(table, "Expected outcome");
                append_table_header(table, "Result");

                for(let j = 0; j < history.length; j++) {
                    let match = history[j];
                    let row = document.createElement("tr");
                    table.appendChild(row);
                    //append_table(row, character);
                    append_table(row, match.timestamp);
                    append_table(row, match.own_rating + " ??" + match.own_deviation);
                    append_table(row, match.floor);
                    let opp_name = append_table(row, match.opponent_name + " ");
                    let link = document.createElement("a");
                    link.appendChild(document.createTextNode("???"));
                    link.href = "#" + match.opponent_id;
                    opp_name.appendChild(link);
                    append_table(row, match.opponent_character);
                    append_table(row, match.opponent_rating + " ??" + match.opponent_deviation);
                    append_table(row, 
                        Math.round(match.expected_result_min * 100)
                        + "???"
                        + Math.round(match.expected_result_max * 100)
                        + "%"
                    );

                    let results = document.createElement("span");
                    results.title = Math.round(100 * match.wins / (match.wins + match.losses)) + "%";
                    results.appendChild(document.createTextNode(match.wins + " - " + match.losses));
                    let td = document.createElement("td");
                    td.appendChild(results);
                    row.appendChild(td);
                }

                let i = document.createElement("i");
                i.appendChild(document.createTextNode("Most games prior to Dec 16th missing."));
                div.appendChild(i);
                div.appendChild(document.createElement("br"));
                div.appendChild(document.createElement("br"));
            }
            {
                let table = document.createElement("table");
                div.appendChild(table);
                append_table_header(table, "Matchup");
                append_table_header(table, "Set Count");
                append_table_header(table, "Win Rate (Real)");
                append_table_header(table, "Win Rate (Adjusted)");

                for(let j = 0; j < stats.matchups.length; j++) {
                    let matchup = stats.matchups[j];
                    let row = document.createElement("tr");
                    table.appendChild(row);
                    append_table(row, matchup.character);
                    append_table(row, matchup.set_count);
                    append_table(row, Math.round(matchup.win_rate * 100) + "%");
                    append_table(row, Math.round(matchup.adjusted_win_rate * 100) + "%");
                }
            }

            div.appendChild(document.createElement("hr"));
        }
    }
}

function append_table_header(node, text) {
    let td = document.createElement("th");
    td.appendChild(document.createTextNode(text));
    node.appendChild(td);
}
function append_table(node, text) {
    let td = document.createElement("td");
    td.appendChild(document.createTextNode(text));
    node.appendChild(td);
    return td;
}

function append_p(node, text) {
    let p = document.createElement("p");
    p.appendChild(document.createTextNode(text));
    node.appendChild(p);
}

function append_div(node, text) {
    let p = document.createElement("div");
    p.appendChild(document.createTextNode(text));
    node.appendChild(p);
}

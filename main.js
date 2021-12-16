"use strict";


let data;

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
                + data.timestamp + " UTC."
            ));
            on_hash_change();

            for(let i = 0; i < data.player_files; i++) {
                fetch("./players/" + i + ".json")
                    .then(response => { 
                        return response.json();
                    })
                    .then(p => { 
                        data.players = data.players.concat(p);
                        on_hash_change();
                });
            }
        });
}

//I'm pretty sure this is a "single page application"
function on_hash_change() {
    if(location.hash === "") {
        show_top_100();
    } else if(location.hash === "#top_100") {
        show_top_100();
    } else if(location.hash === "#player_search") {
        show_player_search();
    } else if(location.hash === "#distribution") {
        show_player_distribution();
    } else if(location.hash === "#about") {
        show_about();
    } else {
        let id = location.hash.replace("#", "");
        show_player(id);
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
        link.appendChild(document.createTextNode("→"));
        link.href = "#" + player.id;
        name.appendChild(link);
        append_table(row, player.character + " ");
        append_table(row, player.rating + " ±" + player.deviation);
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
        //append_table_header(row, "Character");
        //append_table_header(row, "Rating");
        //append_table_header(row, "Sets played");
        //append_table_header(row, "Details");
    }

    if(search_string) {
        search_string = search_string.toLowerCase();
        let results = data.players.filter(p => p.all_names.some(n => n.toLowerCase().includes(search_string)));
        for(let i = 0; i < results.length; i++) {

            let player = results[i];
            let row = document.createElement("tr");
            table.appendChild(row);
            let name = append_table(row, player.name + " ");
            let link = document.createElement("a");
            link.appendChild(document.createTextNode("→"));
            link.href = "#" + player.id;
            name.appendChild(link);
        }
    }
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
        append_table_header(row, "Games played");
    }
    for(let i = 0; i < data.games_per_floor.length; i++) {
        let [label, games] = data.games_per_floor[i];

        let row = document.createElement("tr");
        floor_table.appendChild(row);
        append_table(row, label);
        append_table(row, Math.round(games * 1000) / 10 + "%");
    }

    div.appendChild(document.createElement("br"));

    let ratings_table = document.createElement("table");
    div.appendChild(ratings_table);
    {
        let row = document.createElement("tr");
        ratings_table.appendChild(row);
        append_table_header(row, "Rating");
        append_table_header(row, "Games played");
    }
    for(let i = 0; i < data.games_per_rating.length; i++) {
        let [label, games] = data.games_per_rating[i];
        if(games < 0.001) {
            continue;
        }
        let row = document.createElement("tr");
        ratings_table.appendChild(row);
        append_table(row, label);
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
                        + " ±"
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
                    append_table(row, match.own_rating + " ±" + match.own_deviation);
                    append_table(row, match.floor);
                    let opp_name = append_table(row, match.opponent_name + " ");
                    let link = document.createElement("a");
                    link.appendChild(document.createTextNode("→"));
                    link.href = "#" + match.opponent_id;
                    opp_name.appendChild(link);
                    append_table(row, match.opponent_character);
                    append_table(row, match.opponent_rating + " ±" + match.opponent_deviation);
                    append_table(row, Math.round(match.expected_result * 100) + "%");
                    append_table(row, match.wins + " - " + match.losses);
                }

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

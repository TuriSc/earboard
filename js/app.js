/*
Earboard
By Turi Scandurra. Released to the public domain.
http://www.turiscandurra.com/earboard/
TODO:
- store localStorage data for direction
*/
var sw_version = "1.2",
sw_release_date = "2016-11-22",
note_names = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"],
autoplay_delays = [null, 8000, 6000, 4000],
notes = [],
interval = [],
focus = 12,
note_offset_default = 5, //F
delay = 1000,
r,
last_r,
next_note,
next_chord,
autoplay = false,
auto_current = 0,
editing = false,
show_flag_default = true,
chord_flag_default = true,
show_welcome = true;

/* UTILS */
random_between = function (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

constraint_offset = function(n){
	return Math.min(Math.max(n, 0), notes.length - 25);
}

query = function(id){
	return document.querySelector("#"+id);
}

/* MAIN */
NoteButton = function(i){
	span = document.createElement("span");
	span.classList.add("button", "button-gray");
	span.id = "n" + i;
	return span;
}

init_buttons = function(){
	for(i=0;i<=24;i++){
		note = notes[i + note_offset];
		note_btn = query("n"+i);
		note_btn.i = i;
		note_btn.is_off;
		note_btn.note = note;
		note_btn.onclick = function(){note_click(this)};
	}
}

note_click = function(btn){
		if (editing){
			if (!btn.is_off){
				if(excluded.length < 23){ //enforce minimum two active notes
					excluded.push(btn.i);
					btn.is_off = true;	
					btn.classList.add("off");
					btn.classList.remove("highlight");
				}
			} else {
				excluded = excluded.filter(function(i) { 
					return i !== btn.i;
				});
				btn.is_off = false
				btn.classList.remove("off");
				btn.classList.add("highlight");
			}
		} else {
			if(next_note){
				window.clearTimeout(next_note);
			}
			if (next_chord){
				 window.clearTimeout(next_chord);
			}
			play_note(btn.note);
		}
	}
	

draw_board = function() {
	for(y=4;y>=0;y--){
		row = document.createElement("div");
		row.classList.add("row");
		for(x=0;x<=4;x++){
			i=(y*5)+x;
			btn = new NoteButton(i);
			col = document.createElement("div");
			col.classList.add("column");
			col.appendChild(btn);
			row.appendChild(col);
		}
		query("fretboard").appendChild(row)
	}
}

clear_board = function(){
	for(i=0;i<=24;i++){
		query("n"+i).classList.remove("highlight");
	}
}

display = function(interval){
	if(interval.length>0){
		s = interval[0].slice(0, -1);
		for (i=1;i<interval.length;i++){
		s += " - " + interval[i].slice(0, -1);
		}
	} else {
		s = "- - -";
	}
	query("display").textContent = s;
}

generate_note_names = function() {
	for(i=2;i<=4;i++){
		for(j=0;j<note_names.length;j++){
			notes.push(note_names[j] + i);
		}
	}
	notes.push("C5");
}

parse_notes = function() {
	for (audio in audio_data){
		window["snd_" + audio] = new Audio(audio_data[audio])
	}
}

write_note_names = function() {
	for(i=0;i<=24;i++){
		note = notes[i + note_offset];
		note_btn = query("n"+i);
		note_btn.textContent = note.slice(0, -1);
		note_btn.note = note; // assign new note to button
	}
	display([]); //clear
	clear_board();
}

play_note = function(note){
	snd = window["snd_" + note]
	snd.pause();
	snd.currentTime = 0;
	snd.play();
}

play_interval = function(interval){
	play_note(interval[0])
	if(next_note){
		window.clearTimeout(next_note)
	}
	next_note = setTimeout(function(){ play_note(interval[1]); }, delay);
	if(next_chord){
		window.clearTimeout(next_chord)
	}
	
	next_chord = setTimeout(function(){ if (chord_flag){play_note(interval[0]); play_note(interval[1]); }}, delay*2.5);
	
}

new_interval = function(){
	if (!editing){
		clear_board();
	}
	interval = [notes[12 + note_offset]];
	while (r === last_r || excluded.indexOf(r) > -1) {
		r = random_between(0, 24);
	}
	last_r = r;
	interval.push(notes[r + note_offset]);
	
	if (show_flag && !editing){
		query("n"+12).classList.add("highlight");
		query("n"+ r).classList.add("highlight");
	}
	
	
	direction = query("direction").value;
    if (direction == "random"){
        if (random_between(0, 1) == 1){
            interval.reverse()
        }
    } else if (direction == "desc"){
        interval.reverse()
    } else if (direction == "asc" && r < 12){
        interval.reverse()
    }
    
    display(interval)
    play_interval(interval)
    
}

replay_interval = function(){
	if (interval.length > 0){
        play_interval(interval)
    }
}

toggle_editing = function(flag){
	switch (flag){
		case 0: editing = false;
		break
		case 1: editing = true;
		break
		default: editing = !editing
		break
	}
	
	if (editing){
		query("edit_btn").classList.remove("highlight");
		for(i=0;i<=24;i++){
			note_btn = query("n"+i);
			note_btn.classList.add("editing");
			if (!note_btn.is_off){
				note_btn.classList.add("highlight");
			} else {
				note_btn.classList.add("off");
			}
			
		}
	} else {
		query("edit_btn").classList.add("highlight");
		for(i=0;i<=24;i++){
			note_btn = query("n"+i);
			note_btn.classList.remove("editing");
			note_btn.classList.remove("highlight");
			note_btn.classList.remove("off");
		}
		if (typeof(Storage) !== "undefined") {
			localStorage.setItem("excluded", JSON.stringify(excluded));
		}
	}
}

move_focus = function(d){
	query("n"+focus).classList.remove("focus");
	focus = Math.min(Math.max(focus + d, 0), 24);
	query("n"+focus).classList.add("focus");
}

/* LOCALSTORAGE */
get_data = function(){
	if (typeof(Storage) !== "undefined") {
		if (localStorage.getItem("excluded") != null){
			excluded = JSON.parse(localStorage.getItem("excluded"));
			show_welcome = false;
		} else {
			excluded = [12];
		}
		if (localStorage.getItem("note_offset") != null){
			note_offset = parseInt(localStorage.getItem("note_offset"));
			show_welcome = false;
		} else {
			note_offset = note_offset_default;
		}
		if (localStorage.getItem("show_flag") != null){
			show_flag = localStorage.getItem("show_flag").toLowerCase() == "true";
			show_welcome = false;
		} else {
			show_flag = show_flag_default;
		}
		if (localStorage.getItem("chord_flag") != null){
			chord_flag = localStorage.getItem("chord_flag").toLowerCase() == "true";
			show_welcome = false;
		} else {
			chord_flag = chord_flag_default;
		}
	} else {
		excluded = [12];
		note_offset = note_offset_default;
		show_flag = show_flag_default;
		chord_flag = chord_flag_default;
	}
}

parse_data = function(){
	for(i=0;i<excluded.length;i++){
		note_btn = query("n"+excluded[i]).is_off = true;
	}
	if(!show_flag){
		query("show_btn").classList.add("checkbox-off");
		query("display").style.visibility = "hidden";
	}
	if(!chord_flag){
		query("chord_btn").classList.add("checkbox-off");
	}
}

store_note_offset = function(){
	if (typeof(Storage) !== "undefined") {
		localStorage.setItem("note_offset", note_offset);
	}
}

store_show_flag = function(){
	if (typeof(Storage) !== "undefined") {
		localStorage.setItem("show_flag", show_flag);
	}
}

store_chord_flag = function(){
	if (typeof(Storage) !== "undefined") {
		localStorage.setItem("chord_flag", chord_flag);
	}
}

/* UI */
query("new_btn").onclick = function(){
	toggle_editing(0);
	new_interval();
}

query("replay_btn").onclick = function(){
	replay_interval();
}

query("edit_btn").onclick = function(){
	toggle_editing(2);
}

query("down_btn").onclick = function(){
	toggle_editing(0);
	note_offset = constraint_offset(note_offset-1);
	write_note_names();
	store_note_offset();
}

query("up_btn").onclick = function(){
	toggle_editing(0);
	note_offset = constraint_offset(note_offset+1);
	write_note_names();
	store_note_offset();
}

switch_autoplay = function(){
	toggle_editing(0);
	auto_current = this.n;
	if(autoplay){
		window.clearInterval(autoplay);
		autoplay = false;
	}
	for (i=0;i<=3;i++){
		query("auto_"+i+"_btn").classList.add("off");
	}
	query("" + this.id).classList.remove("off");
	if(this.id === "auto_0_btn"){
		return false;
	}
	new_interval();
	d = this.autoplay_delay + (chord_flag ? 1000 : 0);
	autoplay = window.setInterval(function(){ new_interval(); }, d);
}

for(i=0;i<=3;i++){
	btn = query("auto_"+i+"_btn");
	btn.n = i;
	btn.autoplay_delay = autoplay_delays[i];
	btn.onclick = switch_autoplay;
}


query("show_btn").onclick = function(){
	toggle_editing(0);
	if(!show_flag){
		if (interval.length > 0){
			query("n"+12).classList.add("highlight");
			query("n"+ r).classList.add("highlight");
		}
		query("show_btn").classList.remove("checkbox-off");
		query("display").style.visibility = "initial";
		show_flag = true;
		store_show_flag();
	}else{
		for(i=0;i<=24;i++){
			note_btn = query("n"+i);
			note_btn.classList.remove("highlight");
		}
		query("show_btn").classList.add("checkbox-off");
		query("display").style.visibility = "hidden";
		show_flag = false;
		store_show_flag();
	}
}

query("chord_btn").onclick = function(){
	if(!chord_flag){
		query("chord_btn").classList.remove("checkbox-off");
		chord_flag = true;
		store_chord_flag();
	}else{
		query("chord_btn").classList.add("checkbox-off");
		chord_flag = false;
		store_chord_flag();
	}
}

document.addEventListener("keydown", function(event) {
	if (event.which == 37){//LEFT
		move_focus(-1);
	} else if (event.which == 39){//RIGHT
		move_focus(1);
	} else if (event.which == 38){//UP
		event.preventDefault();
		move_focus(focus<20?5:0);
	} else if (event.which == 40){//DOWN
		event.preventDefault();
		move_focus(focus>4?-5:0);
	} else if (event.which == 32){//SPACEBAR
		event.preventDefault();
		active_btn = query("n"+focus);
		active_btn.click();
		active_btn.classList.add("button-yellow");
		window.setTimeout(function(){
			for (i = 0; i < 25; i++) {
				query("n"+ i).classList.remove("button-yellow");
			}
		}, 500);
	} else if (event.which == 78){//N
		toggle_editing(0);
		new_interval();
	} else if (event.which == 82){//R
		replay_interval();
	} else if (event.which == 65){//A
		auto_current++;
		if (auto_current > 3){auto_current = 0;}
		query("auto_"+auto_current+"_btn").click();
		
	} else if (event.which == 83){//S
		query("show_btn").click();
	} else if (event.which == 67){//C
		query("chord_btn").click();
	}
});

function toggleOverlay() {
	if (query("overlay").classList.contains("open")){
		query("overlay").classList.remove("open");
	} else {
		query("overlay").classList.add("open");
	}
}

/* FULLSCREEN */
function setFullScreen(el) {
    if (el.requestFullscreen) {
        el.requestFullscreen();
    } else if (el.msRequestFullscreen) {
        el.msRequestFullscreen();
    }else if (el.mozRequestFullScreen) {
        el.mozRequestFullScreen();
    }else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
    }
}

function exitFullScreen(){
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    }else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
    }
}

function toggleFullScreen(){
    if(!document.fullscreenElement && !document.msFullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement){
        setFullScreen(document.documentElement);
    }else{
        exitFullScreen();
    }
}

/* INIT */
window.onload = function(){
	get_data();
	generate_note_names();
	parse_notes();
	draw_board();
	init_buttons();
	write_note_names();
	parse_data();
	query("loading").classList.add("fade-out");
	move_focus(0);
	setTimeout(function(){ query("loading").remove(); if(show_welcome){toggleOverlay()}}, 900);
}


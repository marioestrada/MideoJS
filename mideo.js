function Mideo_Player(element)
{
	this.controllerHtml = '\
		<div class="cm_container">\
			<div class="cm_vol cm_control">\
				<div class="cm_row"></div><div class="cm_triangle_left"></div>\
				<div class="cm_mute">\
					<div class="cm_box_1"><div class="cm_circle"></div></div>\
					<div class="cm_box_2"><div class="cm_circle"></div></div>\
					<div class="cm_box_3"><div class="cm_circle"></div></div>\
				</div>\
			</div>\
			<div class="cm_play cm_control"><div class="cm_triangle_right"></div></div>\
			<div class="cm_pause cm_control" style="display: none"><div class="cm_col"></div><div class="cm_col"></div></div>\
			<div class="cm_fwd cm_control"><div class="cm_triangle_right"></div><div class="cm_triangle_right"></div></div>\
			<div class="cm_rew cm_control"><div class="cm_triangle_left"></div><div class="cm_triangle_left"></div></div>\
			<div class="cm_time">00:00:00</div>\
			<div class="cm_trail_total">\
			</div>\
			<div class="cm_trail">\
				<div class="cm_cursor"><div class="cm_square"></div></div>\
			</div>\
			<div class="cm_time_rev">-00:00:00</div>\
		</div>';
	
	this.duration = 0;
	this.muted = false;
	this.currentPercentage = 0;
	
	this.container = element;
	this.videoHtml = this.container.innerHTML;
	
	var remove = this.container.childNodes;
	for(var i = 0; 1 < remove.length; i++)
	{
		this.container.removeChild(remove[i]);
	}
	this.container.innerHTML = this.videoHtml + this.controllerHtml;
	
	this.video = this.container.querySelector('video');
	this.video.autoplay = false;
	
	this.playButton = this.container.querySelector('.cm_play');
	this.pauseButton = this.container.querySelector('.cm_pause');
	this.volumeButton = this.container.querySelector('.cm_vol');
	this.muteState = this.container.querySelector('.cm_mute');
	this.fwdButton = this.container.querySelector('.cm_fwd');
	this.rewButton = this.container.querySelector('.cm_rew');
	this.timeText = this.container.querySelector('.cm_time');
	this.timeRevText = this.container.querySelector('.cm_time_rev');
	this.caretPosition = this.container.querySelector('.cm_cursor');
	this.caretWidth = this.caretPosition.offsetWidth;
	this.trailProgress = this.container.querySelector('.cm_trail');
	this.trailTotal = this.container.querySelector('.cm_trail_total');
	this.seeker = false;
	this.seeking = false;
	this.trailSeek = false;
	this.trailWidth = this.trailTotal.offsetWidth;
	this.trailCursorWidth = this.trailWidth - 1 - this.caretWidth * 1.5;
	this.triggerCanPlay = true;
	this.video.controls = false;
	var _video = this.video,
		_this = this;
	
	var findPos = function(elem)
	{
		var curleft = 0;
		var curtop = 0;
		if(elem.offsetParent)
		{
			do
			{
				curleft += elem.offsetLeft;
				curtop += elem.offsetTop;
			}while(elem = elem.offsetParent)
		}
		return [curleft, curtop];
	}
	
	this.offsetTrail = findPos(this.trailProgress)[0];
	
	var seekWithTrail = function(e)
	{
		if(_this.trailSeek)
			_this.seekToPercentage((e.pageX - _this.offsetTrail) / _this.trailWidth);
	}
	
	this.trailProgress.addEventListener('mousedown', function(e){ _this.trailSeek = true; seekWithTrail(e); }, false);
	this.trailProgress.addEventListener('mousemove', seekWithTrail, false);
	window.addEventListener('mouseup', function(){ _this.trailSeek = false; }, false);

	this.playButton.addEventListener('click', function()
	{
		_video.play();
	}, false);
	
	this.pauseButton.addEventListener('click', function()
	{
		_this.triggerCanPlay = false;
		_video.pause();
	}, false);
	
	this.volumeButton.addEventListener('click', function()
	{
		if(_this.muted)
		{
			_this.muteState.style.display = 'block';
		}else{
			_this.muteState.style.display = 'none';
		}
		_this.muted = !_this.muted;
		_video.muted = _this.muted;
	}, false);
	
	this.preSeekPaused = false;
	var seek = function()
	{
		switch(_this.seeking)
		{
		case 'fwd':
			var new_time = _video.currentTime + 1;
			_video.currentTime = new_time < _video.duration ? new_time : _video.duration;
			break;
		case 'rew':
			var new_time = _video.currentTime - 1;
			_video.currentTime = new_time > 0 ? new_time : 0;
			break;
		}
	}
	var startSeeking = function(dir)
	{
		_this.preSeekPaused = _video.paused;
		_video.pause();
		_this.seeking = dir;
		_this.seeker = setInterval('seek()', 100);
	}
	var stopSeeking = function(e)
	{
		if(!_this.preSeekPaused)
			_video.play();
		
		_this.seeking = false;
		clearInterval(_this.seeker);
	}
	this.fwdButton.addEventListener('mousedown', function(){ startSeeking('fwd'); }, false);
	this.rewButton.addEventListener('mousedown', function(){ startSeeking('rew'); }, false);
	this.fwdButton.addEventListener('mouseup', stopSeeking, false);
	this.rewButton.addEventListener('mouseup', stopSeeking, false);
	
	this.video.addEventListener('progress', this, false);
	this.video.addEventListener('durationchange', this, false);
	this.video.addEventListener('timeupdate', this, false);
	this.video.addEventListener('pause', this, false);
	this.video.addEventListener('play', this, false);
	this.video.addEventListener('load', this, false);
	this.video.addEventListener('canplaythrough', this, false);
	
	this.updateState();
};

Mideo_Player.prototype.handleEvent = function(event)
{
	switch(event.type)
	{
	case 'durationchange':
		this.duration = this.video.duration;
		break;
	case 'timeupdate':
		this.currentPercentage = this.video.currentTime / this.video.duration;
		var caret_position = (this.currentPercentage * (this.trailCursorWidth));
		this.caretPosition.style.left = 3 + caret_position + 'px';
		
		var length = this.video.currentTime;
		if(!isNaN(length))
			this.timeText.textContent = this.formatTime(length);
		
		length = this.video.duration - this.video.currentTime;
		if(!isNaN(length))
			this.timeRevText.textContent = '-' + this.formatTime(length);
		
		if(this.video.currentTime >= this.video.duration)
		{
			this.video.pause();
		}
		break;
	case 'play':
		this.updateBar(event);
		this.triggerCanPlay = true;
	case 'pause':
		this.updateState();
		break;
	case 'load':
	case 'progress':
		this.updateBar(event);
		break;
	case 'canplaythrough':
		if(this.triggerCanPlay)
			this.video.play();
		break;
	}
}

Mideo_Player.prototype.seekToPercentage = function(percentage)
{
	if(this.video.duration > 0)
		this.video.currentTime = this.video.duration * percentage;
}

Mideo_Player.prototype.updateState = function()
{
	if(this.video.paused)
	{
		this.playButton.style.display = 'block';
		this.pauseButton.style.display = 'none';
	}else{
		this.playButton.style.display = 'none';
		this.pauseButton.style.display = 'block';
	}
}

Mideo_Player.prototype.formatTime = function(duration)
{
	var time = [];
	time[0] = Math.floor(duration / 3600);
	time[1] = Math.floor((duration % 3600) / 60);
	time[2] = Math.floor(duration % 60);
	for(var i = 0; i < 3; i++)
	{
		time[i] = time[i] < 10 ? '0' + time[i] : time[i];
	}
	return time.join(':');
}

Mideo_Player.prototype.updateBar = function(e)
{
	var rel = 0, update = false;
	if(typeof this.video.buffered != 'undefined')
	{
		if(!isNaN(this.video.duration))
		{
			rel = (this.video.buffered.end(0) / this.video.duration);
			update = true;
		}
	}else if(e.lengthComputable){
		rel = e.loaded / e.total;
		update = true;
	}
	if(update)
	{
		var width = (this.trailWidth - 2) * rel;
		this.trailProgress.style.width = width + 'px';
	}
}

var init = function()
{
	var elements = document.querySelectorAll('.cm_player');
	var players = [];
	for(var i = 0; i < elements.length; i++)
	{
		players.push(new Mideo_Player(elements[i]));
	}
}

window.addEventListener('load', init, false);
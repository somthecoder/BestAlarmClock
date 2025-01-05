window.onload = function() {
	// global vars
	const timeButton = document.getElementById('timeButton');
	let intervalId;

	// functions
	timeButton.onclick = function() {
		const now = new Date();
		const formattedTime = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
		timeButton.textContent = formattedTime;	
	};

	function showTime(endDate) {
		// getting current date
		const now = new Date();
		const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
		document.getElementById('clock').textContent = timeString;
	
		// checking for end time
		if (now.getTime() >= endDate.getTime()) {
			console.log('got to end');
			clearInterval(intervalId);
		}
	}

	const  end = new Date(2025, 0, 5, 14, 34);
	intervalId = setInterval(() => showTime(end), 60000);
	showTime(end);
};



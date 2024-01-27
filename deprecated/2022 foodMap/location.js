function initMap() {
	const helsinki = { lat: 60.162, lng: 24.946 };
	const map = new google.maps.Map(document.getElementById("map"), {
		center: helsinki,
		zoom: 12,
		mapId: "880d45fd834fdb23",
		disableDefaultUI: true,
		clickableIcons: false,
	});

	map.addListener("dragend", () => {
		let pos = map.getCenter().toString();
		let posFinal = pos.substring(1).slice(0, -1).replace(", ", "|");
		document.getElementById("locationText").innerHTML = "Sijainti: " + posFinal;
		document.getElementById("hiddenLoc").innerHTML = posFinal;
	});

	window.addEventListener("load", () => {
		// Try HTML5 geolocation.
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition((position) => {
				const pos = {
					lat: position.coords.latitude,
					lng: position.coords.longitude,
				};

				document.getElementById("hiddenLoc").innerHTML = pos.lat + "|" + pos.lng;

				map.setCenter(pos);
				map.setZoom(16);
			});
		}
	});
}

window.initMap = initMap;

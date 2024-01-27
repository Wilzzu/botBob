import db from "./database/data.json" assert { type: "json" };
function initMap() {
	const helsinki = { lat: 60.162, lng: 24.946 };
	const map = new google.maps.Map(document.getElementById("map"), {
		center: helsinki,
		zoom: 12,
		mapId: "880d45fd834fdb23",
		disableDefaultUI: true,
		clickableIcons: false,
	});
	let infoWindow = new google.maps.InfoWindow();

	db.forEach((e) => {
		const marker = new google.maps.Marker({
			position: { lat: parseFloat(e.content.lat), lng: parseFloat(e.content.long) },
			map: map,
			icon: {
				url: "food-emoji.svg",
				scaledSize: new google.maps.Size(50, 50),
			},
			label: {
				text: e.content.name,
				fontSize: "16px",
				color: "white",
				className: "foodLabel",
			},
			animation: google.maps.Animation.DROP,
		});
		let commentBox = "";
		if (e.comments.length > 0) {
			e.comments.forEach((e) => {
				commentBox +=
					'<div id="commentBox">' +
					'<div id="commenter">' +
					'<img src="' +
					e.img +
					'"/>' +
					"<p>" +
					e.name +
					"</p>" +
					"</div>" +
					"<p>" +
					e.comment +
					"</p>" +
					"</div>" +
					'<div id="breaker"></div>';
			});
		} else {
			commentBox = "<p>Ei kommentteja :(</p>";
		}

		// jos 0 = ei tuu commentBoxia vaa iha p tagi jossa "ei kommennteja :("
		let cont =
			'<div id="infoWindow">' +
			'<p id="postID">ID: ' +
			e.id +
			"</p>" +
			'<div id="userInfo">' +
			'<img src="' +
			e.content.profilePic +
			'"/>' +
			"<h1>" +
			e.content.name +
			"</h1>" +
			"</div>" +
			"<p>📅 " +
			e.content.date +
			" | 🕒 " +
			e.content.time +
			"</p>" +
			"<p style='font-weight: bold'>" +
			e.content.rating +
			"</p>" +
			'<div id="mainImg">' +
			'<a href="' +
			e.content.pic +
			'" target="_blank">' +
			'<img src="' +
			e.content.pic +
			'"/>' +
			"</a>" +
			"</div>" +
			"<p id='likes'>" +
			e.likes.amount +
			" 👍</p>" +
			"<div id=linkToPost>" +
			"<p style='margin: 10px 0 10px 0;'>Voit tykätä ja kommentoida postausta Discordissa:</p>" +
			'<a id="discordBtnA" href="discord://discord.com/channels/582575029800402974/1032059443636092928/' +
			e.id +
			'">' +
			'<div id="discordBtn">' +
			"<p>Siirry postaukseen</p>" +
			'<img src="./dcLogo.png" />' +
			"</div></a></div>" +
			'<div id="comments">' +
			"<h4>Kommentit:</h4>" +
			commentBox +
			"</div>" +
			"</div>";
		infoWindow.setContent(cont);

		google.maps.event.addListener(marker, "click", function () {
			infoWindow.open(map, marker);
			infoWindow.setContent(cont);
		});

		google.maps.event.addListener(map, "click", () => {
			infoWindow.close();
		});
	});
}

window.initMap = initMap;

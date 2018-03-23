setTimeout(function() {
	var $chests = document.querySelectorAll('[chest]');
	var $chestToUse = $chests[Math.floor(Math.random() * $chests.length)];
	var $lid = $chestToUse.querySelector('.box-lid')
	$lid.body.applyImpulse(new CANNON.Vec3(0, 40, 0), new CANNON.Vec3(0, 0, 0));

	setTimeout(function() {
		$lid.body.applyImpulse(new CANNON.Vec3(-40, 0, 0), new CANNON.Vec3(0, 0, 0));
	}, 1500	)
}, 500)
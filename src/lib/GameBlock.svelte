<script>
    import { onMount, tick } from "svelte";

    let canvas;
    let canvasContext;
    let animationFrameId;
    let height;
    let width;
    let button;

    let game = {
        state: "Start",
        victory: "Not Yet",
        padelRight: {
            x: 0,
            y: 0,
            height: () => {
                return height * 0.1;
            },
            width: () => {
                return width * 0.01;
            },
        },
        padelLeft: {
            x: 0,
            y: 0,
            height: () => {
                return height * 0.1;
            },
            width: () => {
                return width * 0.01;
            },
        },
        ball: {
            x: 0,
            y: 0,
            side: () => {
                return height * 0.01;
            },
            acceleration: 100,
            velocity: {
                x: 1,
                y: 1,
            },
        },
        level: 1,
        score: {
            current: 0,
            history: [],
        },
        acceleration: {
            base: 0.1,
            current: 0.1,
        },
        velocity: {
            base: 1000,
            currentPlayer: 10000,
            currentAi: 10000,
        },
        seconds: 0,
        oldTimestamp: 0,
    };

    function randomVelocity() {
        let randomNumber = Math.round(Math.random() * 10) / 10;
        if (randomNumber > 0.2 && randomNumber < 0.8) {
            let v =
                Math.random() > 0.5 ? randomNumber + 1 : randomNumber * -1 + -4;
            return 100 * v;
        } else {
            return randomVelocity();
        }
    }

    function roundNumber(number) {
        if (number < 0) {
            return Math.round(-1 * number * 100) / -100;
        } else {
            return Math.round(number * 100) / 100;
        }
    }

    function updateDimensions() {
        let originalHeight = canvas.getBoundingClientRect().height;
        let originalWidth = canvas.getBoundingClientRect().width;

        let dimensions = getObjectFitSize(
            true,
            canvas.clientWidth,
            canvas.clientHeight,
            canvas.width,
            canvas.height
        );

        const dpr = window.devicePixelRatio || 1;
        canvas.width = dimensions.width * dpr;
        canvas.height = dimensions.height * dpr;
        height = dimensions.height;
        width = dimensions.width;

        canvasContext = canvas.getContext("2d");
        let ratio = Math.min(
            canvas.clientWidth / originalWidth,
            canvas.clientHeight / originalHeight
        );

        canvasContext.scale(ratio * dpr, ratio * dpr); //adjust this!
    }

    function getObjectFitSize(
        contains /* true = contain, false = cover */,
        containerWidth,
        containerHeight,
        width,
        height
    ) {
        var doRatio = width / height;
        var cRatio = containerWidth / containerHeight;
        var targetWidth = 0;
        var targetHeight = 0;
        var test = contains ? doRatio > cRatio : doRatio < cRatio;

        if (test) {
            targetWidth = containerWidth;
            targetHeight = targetWidth / doRatio;
        } else {
            targetHeight = containerHeight;
            targetWidth = targetHeight * doRatio;
        }

        return {
            width: targetWidth,
            height: targetHeight,
            x: (containerWidth - targetWidth) / 2,
            y: (containerHeight - targetHeight) / 2,
        };
    }

    function touchPadel(ball, padel, position) {
        let ballGeometry = {
            a: {
                x: ball.x,
                y: ball.y,
            },
            b: {
                x: ball.x + ball.side(),
                y: ball.y,
            },
            c: {
                x: ball.x,
                y: ball.y + ball.side(),
            },
            d: {
                x: ball.x + ball.side(),
                y: ball.y + ball.side(),
            },
            middle: ball.y + ball.side() / 2,
            };
            
        if (position == "left") {
            if (
                padel.x + padel.width() >= ballGeometry.a.x &&
                ballGeometry.a.x >= padel.x
            ) {
                if (
                    (ballGeometry.a.y > padel.y &&
                        ballGeometry.a.y < padel.y + padel.height()) ||
                    (ballGeometry.c.y >= padel.y &&
                        ballGeometry.c.y <= padel.y + padel.height())
                ) {
                    //return (ballGeometry.middle > (padel.y + padel.height/2))? (-2*(ballGeometry.middle-padel.y)/padel.height)+2:2*(ballGeometry.middle-padel.y)/padel.height;
                    return 1;
                }
            }
        }

        if (position == "right") {
            if (
                padel.x <= ballGeometry.b.x &&
                ballGeometry.b.x <= padel.x + padel.width() &&
                ((ballGeometry.b.y > padel.y &&
                    ballGeometry.b.y < padel.y + padel.height()) ||
                    (ballGeometry.d.y > padel.y &&
                        ballGeometry.d.y < padel.y + padel.height()))
            ) {
                //return (ballGeometry.middle > (padel.y + padel.height/2))? (-2*(ballGeometry.middle-padel.y)/padel.height)+2:2*(ballGeometry.middle-padel.y)/padel.height;
                return 1;
            }
        }

        return 0;
    }

    function youLoose() {
        game.victory = "Loose";
        game.score.current = 0;
        pauseGame();
        canvasContext.font = `${0.1 * height}px arial`;
        canvasContext.strokeStyle = "#ffffff";
        let textMetrics = canvasContext.measureText("You loose!");
        canvasContext.strokeText(
            "You Loose!",
            width / 2 - textMetrics.width / 2,
            height / 2
        );
        canvasContext.font = `${0.05 * height}px arial`;
        textMetrics = canvasContext.measureText("Press enter to continue.");
        canvasContext.strokeText(
            "Press enter to continue.",
            width / 2 - textMetrics.width / 2,
            height / 2 + 30
        );
        debugger;
    }

    function youWin() {
        game.victory = "Win";
        pauseGame();
        canvasContext.font = `${0.1 * height}px arial`;
        canvasContext.strokeStyle = "#ffffff";
        let textMetrics = canvasContext.measureText("You Win!");
        canvasContext.strokeText(
            "You Win!",
            width / 2 - textMetrics.width / 2,
            height / 2
        );
        canvasContext.font = "30px arial";
        textMetrics = canvasContext.measureText("Press enter to continue.");
        canvasContext.strokeText(
            "Press enter to continue.",
            width / 2 - textMetrics.width / 2,
            height / 2 + 30
        );
        debugger;
    }

    function reset() {
        updateDimensions();

        clearCanvas();

        setupGameElementDimensionsAndRendering();

        drawGameElements();
    }

    function clearCanvas() {
        canvasContext.clearRect(0, 0, width, height);
        canvasContext.fillStyle = "#000";
        canvasContext.fillRect(0, 0, width, height);
    }

    function setupGameElementDimensionsAndRendering() {
        game.level = 1;
        game.padelLeft.x = Math.floor(width / 20 + 5);
        game.padelLeft.y = Math.floor(height / 2 - game.padelLeft.height() / 2);
        game.padelRight.x = Math.floor(width - width / 20 - 5);
        game.padelRight.y = Math.floor(
            height / 2 - game.padelLeft.height() / 2
        );
        game.ball.x = Math.floor(width / 2 - 5);
        game.ball.y = Math.floor(height / 2 - 5);
        game.ball.velocity.y = randomVelocity();
        game.ball.velocity.x = randomVelocity();
        /* canvasContext.fillRect(30, 30 , 50, 50); */
    }

    function drawGameElements() {
        canvasContext.fillStyle = "#FFF";
        canvasContext.fillRect(
            game.padelLeft.x,
            game.padelLeft.y,
            game.padelRight.width(),
            game.padelRight.height()
        );
        canvasContext.fillRect(
            game.padelRight.x,
            game.padelRight.y,
            game.padelRight.width(),
            game.padelRight.height()
        );
        canvasContext.fillRect(
            game.ball.x,
            game.ball.y,
            game.ball.side(),
            game.ball.side()
        );
    }

    function resizeDrawContext() {
        canvasContext = canvas.getContext("2d");
    }

    function upLevel() {
        game.level = +1;
        game.ball.velocity.x += 1;
        game.ball.velocity.y += 1;
        game.velocity.currentAi += 1000;
        game.score.current += 100;
    }

    function moveBall() {
        let shiftY = roundNumber(game.ball.velocity.y * game.seconds);
        let shiftX = roundNumber(game.ball.velocity.x * game.seconds);

        //console.log(`Ball position: x ${game.ball.x} y ${game.ball.y}, shift: x ${shiftX} y ${shiftY}`)
        if (
            game.ball.y + shiftY < 0 ||
            game.ball.y + shiftY + game.ball.side() > height
        ) {
            game.ball.velocity.y *= -1;
        }
        //console.log(touchPadel(game.ball, game.padelLeft, 'left'));

        let rebound =
            touchPadel(game.ball, game.padelLeft, "left") ||
            touchPadel(game.ball, game.padelRight, "right");

        //console.log(rebound);

        if (rebound > 0) {
            game.ball.velocity.x *= -1 * rebound;
        } else if (game.ball.x < 0) {
            youLoose();
        } else if (game.ball.x > width) {
            youWin();
        }

        shiftY = roundNumber(game.ball.velocity.y * game.seconds);
        shiftX = roundNumber(game.ball.velocity.x * game.seconds);

        game.ball.y += roundNumber(shiftY);
        game.ball.x += roundNumber(shiftX);

        //console.log(`Change in x: ${aditionx}, change in y: ${aditiony}`);
    }

    function aiRightPadel() {
        let adition = game.velocity.currentAi * game.seconds;
        //console.log(`Padel position: x ${game.padelLeft.x} y ${game.padelLeft.x}, shift: ${adition}`);
        if (game.ball.y < game.padelRight.y + game.padelRight.height() / 2) {
            if (game.padelRight.y - adition > 0) {
                game.padelRight.y -= adition;
            }
        } else if (game.ball.y > game.padelRight.y + game.padelRight.height()) {
            if (game.padelRight.y + adition < height) {
                game.padelRight.y += adition;
            }
        }
    }

    function movePadel(direction) {
        let adition = game.velocity.currentPlayer * game.seconds;
        //console.log(`Move ratio ${adition}`);
        if (direction === "up") {
            if (game.padelLeft.y - adition > 0) {
                game.padelLeft.y -= adition;
            }
        } else if (direction === "down") {
            if (game.padelLeft.y + game.padelLeft.height() + adition < height) {
                game.padelLeft.y += adition;
            }
        }
    }

    function updateRefreshRate(timestamp){
        //console.log(`Timestamps - Old: ${game.oldTimestamp} New: ${timestamp}`);
        let newRefreshRate = (timestamp - game.oldTimestamp) / 1000
        let refreshRate = 0.001;
        if(newRefreshRate > 0){
            refreshRate = Math.min(newRefreshRate, 0.001);
        }
        //console.log(`Refresh rate: ${newRefreshRate} default: 0.001 min: ${refreshRate}`);
        game.seconds = refreshRate;
        game.oldTimestamp = timestamp;
    }

    function animateGame(timestamp) {
        if (game.state == "Ongoing") {
            updateDimensions();
            updateRefreshRate(timestamp);
            clearCanvas();
            drawGameElements();
            moveBall();
            aiRightPadel();
            animationFrameId = window.requestAnimationFrame(animateGame);
        }
    }

    function pauseGame() {
        game.state = "Pause";
        window.cancelAnimationFrame(animationFrameId);
    }

    function continueGame() {
        if (game.state === "Pause" && game.victory === "Win") {
            upLevel();
            //console.trace(game.level);
            reset();
            game.state = "Ongoing";
            startGame();
        } else if (game.state === "Pause" && game.victory === "Loose") {
            reset();
            game.state = "Start";
            button.removeAttribute("disabled");
        }
        //console.trace(game.level);
    }

    function startGame() {
        if (game.state == "Start") {
            game.state = "Ongoing";
            button.setAttribute("disabled", "true");
            animationFrameId = window.requestAnimationFrame(animateGame);
        }
        if (game.state == "Ongoing") {
            animationFrameId = window.requestAnimationFrame(animateGame);
        } else {
            game.state = "Start";
            button.removeAttribute("disabled");
            window.cancelAnimationFrame(animationFrameId);
            reset();
        }
    }

    function handleUserAction(e) {
        switch (e.keyCode) {
            //Up ArrowKey
            case 38:
                movePadel("up");
                break;
            //Down ArrowKey
            case 40:
                movePadel("down");
                break;
            case 13:
                continueGame();
                break;
            default:
                break;
        }
    }

    onMount(async () => {
        await tick();
        reset();
    });
</script>

<div class="game-container">
    <button on:click={startGame} bind:this={button}>{game.state}</button>
    <canvas bind:this={canvas} on:resize={updateDimensions} />
    <div class="description">
        <p>Level: <span>{game.level}</span></p>
        <p>Score: <span>{game.score.current}</span></p>
        <p>Game: <span>{game.state}</span></p>
    </div>
    <div class="scores">
        {#each game.score.history as scorePoint}
            <p>{scorePoint}</p>
        {/each}
    </div>
</div>

<svelte:window on:keydown={handleUserAction} />

<style>
    .game-container {
        display: flex;
        flex-direction: column;
    }

    .game-container > *{
        margin-top: 2rem;
    }

    button {
        width: fit-content;
        font-weight: bold;
        background-color: black;
    }

    canvas {
        height: 30%;
        width: 100%;
        object-fit: contain;
    }

    .description {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }

    .scores {

    }
</style>

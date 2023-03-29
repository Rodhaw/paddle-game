<script>
    import { onMount } from "svelte";

    let canvas;
    let canvasContext;
    let animationFrameId;
    let h;
    let w;
    let button;

    let game = {
        state: "Start",
        victory: "Not Yet",
        padelRight: {
            x: 0,
            y: 0,
            heigth: 50,
            width: 10,
        },
        padelLeft: {
            x: 0,
            y: 0,
            heigth: 50,
            width: 10,
        },
        ball: {
            x: 0,
            y: 0,
            side: 10,
            acceleration: 1,
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
            base: 1,
            currentPlayer: 10000,
            currentAi: 1000,
        },
        seconds: 0,
        oldTimestamp: 0,
    };

    function randomVelocity() {
        let randomNumber = Math.round(Math.random() * 10) / 10;
        if (randomNumber > 0.2 && randomNumber < 0.8) {
            return Math.random() > 0.5 ? randomNumber + 1 : (randomNumber *-1)+-4;
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

    function touchPadel(ball, padel, position) {
        let ballGeometry = {
            a: {
                x: ball.x,
                y: ball.y,
            },
            b: {
                x: ball.x + ball.side,
                y: ball.y,
            },
            c: {
                x: ball.x,
                y: ball.y + ball.side,
            },
            d: {
                x: ball.x + ball.side,
                y: ball.y + ball.side,
            },
            middle: ball.y + ball.side/2,
        };

        if (position == "left") {
            if (padel.x + padel.width >= ballGeometry.a.x && ballGeometry.a.x >= padel.x) {
                if (
                    (ballGeometry.a.y > padel.y &&
                    ballGeometry.a.y < padel.y + padel.heigth) ||
                    (ballGeometry.c.y >= padel.y &&
                    ballGeometry.c.y <= padel.y + padel.heigth)
                ) {
                    //return (ballGeometry.middle > (padel.y + padel.heigth/2))? (-2*(ballGeometry.middle-padel.y)/padel.heigth)+2:2*(ballGeometry.middle-padel.y)/padel.heigth;
                    return 1;
                }
            }
        }

        if (position == "right") {
            if (
                (padel.x <= ballGeometry.b.x && ballGeometry.b.x <= padel.x + padel.width) &&
                ((ballGeometry.b.y > padel.y &&
                    ballGeometry.b.y < padel.y + padel.heigth) ||
                    (ballGeometry.d.y > padel.y &&
                        ballGeometry.d.y < padel.y + padel.heigth))
            ) {
                //return (ballGeometry.middle > (padel.y + padel.heigth/2))? (-2*(ballGeometry.middle-padel.y)/padel.heigth)+2:2*(ballGeometry.middle-padel.y)/padel.heigth;
                return 1;
            }
        }

        return 0;
    }

    function youLoose() {
        game.victory = "Loose";
        game.score.current = 0;
        pauseGame();
        canvasContext.font = '50px arial';
        canvasContext.strokeStyle = "#ffffff";
        let textMetrics = canvasContext.measureText('You loose!');
        canvasContext.strokeText("You Loose!", w/2-textMetrics.width/2, h/2);
        canvasContext.font = '30px arial';
        textMetrics = canvasContext.measureText('Press enter to continue.');
        canvasContext.strokeText("Press enter to continue.", w/2-textMetrics.width/2, h/2+30);
    }

    function youWin() {
        game.victory = "Win";
        pauseGame();
        canvasContext.font = '50px arial';
        canvasContext.strokeStyle = "#ffffff";
        let textMetrics = canvasContext.measureText('You Win!');
        canvasContext.strokeText("You Win!", w/2-textMetrics.width/2, h/2);
        canvasContext.font = '30px arial';
        textMetrics = canvasContext.measureText('Press enter to continue.');
        canvasContext.strokeText("Press enter to continue.", w/2-textMetrics.width/2, h/2+30);
    }

    function reset() {
        canvasContext.clearRect(0, 0, w, h);
        canvasContext.fillStyle = "#000";
        canvasContext.fillRect(0, 0, w, h);
        game.level = 1;
        game.padelLeft.x = w / 50 + 5;
        game.padelLeft.y = h / 2 - game.padelLeft.heigth / 2;
        game.padelRight.x = w - w / 50 - 5;
        game.padelRight.y = h / 2 - game.padelLeft.heigth / 2;
        game.ball.x = w / 2 - 5;
        game.ball.y = h / 2 - 5;
        game.ball.velocity.y = h * randomVelocity();
        game.ball.velocity.x = w * randomVelocity();
        canvasContext.fillStyle = "#FFF";
        canvasContext.fillRect(
            game.padelLeft.x,
            game.padelLeft.y,
            game.padelLeft.width,
            game.padelLeft.heigth
        );
        canvasContext.fillRect(
            game.padelRight.x,
            game.padelRight.y,
            game.padelRight.width,
            game.padelRight.heigth
        );
        canvasContext.fillRect(
            game.ball.x,
            game.ball.y,
            game.ball.side,
            game.ball.side
        );
        //console.log(game.ball.velocity);
    }

    onMount(() => {
        canvasContext = canvas.getContext("2d");
        h = canvas.height;
        w = canvas.width;
        canvasContext.lineWidth = 1;
        reset();
    });

    function resizeCanvas(){
        if(h != canvas.height){
            debugger
        }

        if(w != canvas.width){
            debugger
        }
    }

    function upLevel() {
        game.level =+ 1;
        game.ball.velocity.x += 1;
        game.ball.velocity.y += 1;
        game.velocity.currentAi+= 1000;
        game.score.current += 100;
    }

    function ballMovement() {
        let yPosition = roundNumber(game.ball.velocity.y * game.seconds);
        let xPosition = roundNumber(game.ball.velocity.x * game.seconds);
        if (
            game.ball.y + yPosition < 0 ||
            game.ball.y + yPosition + game.ball.side > h
        ) {
            game.ball.velocity.y *= -1;
        }
        //console.log(touchPadel(game.ball, game.padelLeft, 'left'));

        let rebound = touchPadel(game.ball, game.padelLeft, "left") || touchPadel(game.ball, game.padelRight, "right"); 

        //console.log(rebound);

        if (rebound > 0) {
            game.ball.velocity.x *= -1 * rebound;
        } else if (game.ball.x < 0) {
            youLoose();
        } else if (game.ball.x > w) {
            youWin();
        }

        let aditiony = game.ball.velocity.y * game.seconds;
        game.ball.y += roundNumber(aditiony);
        let aditionx = game.ball.velocity.x * game.seconds;
        game.ball.x += roundNumber(aditionx);

        //console.log(`Change in x: ${aditionx}, change in y: ${aditiony}`);
    }

    function aiRightPadel() {
        let adition = game.velocity.currentAi * game.seconds;
        if (game.ball.y < game.padelRight.y + game.padelRight.heigth / 2) {
            if (game.padelRight.y - adition > 0) {
                game.padelRight.y -= adition;
            }
        } else if (game.ball.y > game.padelRight.y + game.padelRight.heigth) {
            if (game.padelRight.y + adition < h) {
                game.padelRight.y += adition;
            }
        }
    }

    function animateGame(timestamp) {
        resizeCanvas();
        if (game.state == "Ongoing") {
            game.seconds = Math.min(
                (timestamp - game.oldTimestamp) / 1000,
                0.001
            );
            game.oldTimestamp = timestamp;
            canvasContext.clearRect(0, 0, w, h);
            canvasContext.fillStyle = "#000";
            canvasContext.fillRect(0, 0, w, h);
            canvasContext.fillStyle = "#FFF";
            canvasContext.fillRect(
                game.padelLeft.x,
                game.padelLeft.y,
                game.padelLeft.width,
                game.padelLeft.heigth
            );
            canvasContext.fillRect(
                game.padelRight.x,
                game.padelRight.y,
                game.padelRight.width,
                game.padelRight.heigth
            );
            canvasContext.fillRect(
                game.ball.x,
                game.ball.y,
                game.ball.side,
                game.ball.side
            );
            ballMovement();
            aiRightPadel();
            animationFrameId = window.requestAnimationFrame(animateGame);
        }
    }

    function movePadel(direction) {
        let adition = game.velocity.currentPlayer * game.seconds;
        if (direction == "up") {
            if (game.padelLeft.y - adition > 0) {
                game.padelLeft.y -= adition;
            }
        } else if ("down") {
            if (game.padelLeft.y + game.padelLeft.heigth + adition < h) {
                game.padelLeft.y += adition;
            }
        }
    }

    function pauseGame() {
        game.state = "Pause";
        window.cancelAnimationFrame(animationFrameId);
    }

    function continueGame(){
        if(game.state==='Pause' && game.victory === "Win"){
            upLevel();
            //console.trace(game.level);
            reset();
            game.state = "Ongoing";
            startGame();
        } else if(game.state === 'Pause' && game.victory === 'Loose'){
            reset();
            game.state = "Start";
            button.removeAttribute('disabled');
        }
        console.trace(game.level);
    }

    function startGame() {
        if (game.state == "Start") {
            game.state = "Ongoing";
            button.setAttribute('disabled','');
            animationFrameId = window.requestAnimationFrame(animateGame);
        } if(game.state == "Ongoing"){
            animationFrameId = window.requestAnimationFrame(animateGame);
        }else {
            game.state = "Start";
            button.removeAttribute('disabled');
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

    
</script>

<div class="game-container">
    <button on:click={startGame} bind:this={button}>{game.state}</button>
    <canvas
        bind:this={canvas}
    />
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
        position: relative;
    }

    button {
        position: absolute;
        top: 100px;
        left: 150px;
    }

    canvas {
        position: absolute;
        top: 200px;
        left: 150px;
    }

    .description {
        position: absolute;
        top: 700px;
        left: 150px;
        width: 1000px;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }

    .scores {
        position: absolute;
        top: 750px;
        left: 150px;
    }
</style>

<script>
    let lamp = 'off';

    function turnOnLamp(){
        lamp = (lamp == 'off')? 'on': 'off';
    }
</script>

<div>
    <div id="lamp" class={lamp}></div>
    <p>Lamp is {lamp}</p>
    <button on:click={turnOnLamp}>
        Turn {lamp} lamp
    </button>
</div>

<style>
    #lamp{
        width: 200px;
        height: 100px;
    }

    .on{
        background-color: yellow;
        border: 2px  linear-gradient(to bottom, red, rg(0 0 0 0) 1 100%) solid;
    }

    .off{
        background-color: black;
        border: 2px  linear-gradient(to bottom, gray, rg(0 0 0 0) 1 100%) solid;
    }
</style>
<script>

</script>

<div id="animation">
    <p></p>
</div>

<style>
    #animation{
        height: 200px;
        width: 300px;
        position: relative;
    }

    p{
        position: absolute;
        top: 90px;
        left: 90px;
        height: 10px;
        width: 10px;
        border-radius: 20%;
        background-color: black;
        animation: movement;
        animation-duration: 2s;
    }

    @keyframes movement{
        from{
            width: 20px;
            height: 20px;
        }
        to{
            width: 20px;
            height: 20px;
        }
    }
</style>
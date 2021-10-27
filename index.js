const hex = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F']

//Adding event listener to an array of buttons and calling function randomNumber
let button = document.getElementById('btn')
let text = document.getElementById('text')
let color = document.getElementById('color')
let input = document.getElementById('value')
let content = document.getElementById('content')


    button.addEventListener('click', function () {
        let hexColor = '#';
        for (let i = 0; i < 6; i++) {
          hexColor += hex[getRandomNumber()];
        }
        // color.textContent = hexColor;
        button.style.backgroundColor = hexColor
        color.style.backgroundColor = hexColor
        if (input.value == hexColor) {
          text.innerHTML = 'You Are Right!'
          text.classList.add('right')
          input.value = ''
          content.style.backgroundColor = hexColor
        } else {
          text.innerHTML = ` ${hexColor} You Are Wrong! Try Again!` 
          input.value = ''
          content.style.backgroundColor = 'white'
        }
        
    })

    function getRandomNumber() {
        return Math.floor(Math.random() * hex.length);
    }
    

    

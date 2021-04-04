<?php 
session_start();
?>
<!DOCTYPE html>
<html lang="fr">
<head>  
    <title>Facebook_clone</title>
    <meta charset="UTF-8">
    
<link rel="icon" id="favicon" href="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAoHCBUWFRgSEhYYGBgYGh4YHRwYGhkaGBoZGBgZGhkZGhgcIzElHB4tLRoaJzgnKy8xNTU1HCQ7QDszPy40NTEBDAwMEA8QHxISHzUrJSs0NjE6Oj02NDQ0NjQ1NDQ3NDQ0PTQxNDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NP/AABEIAOEA4QMBIgACEQEDEQH/xAAcAAEAAQUBAQAAAAAAAAAAAAAABgEEBQcIAgP/xAA/EAACAQIDBQQHBgUFAAMBAAABAgADEQQhMQUGEkFRImFxgQcTMlKRodEUQlNygpIVI2KxwUOiwuHwNNLxJP/EABoBAQACAwEAAAAAAAAAAAAAAAADBAECBQb/xAArEQACAgEDAgUDBQEAAAAAAAAAAQIRAwQhMRJRBRNBYZEycYEiQlKx0aH/2gAMAwEAAhEDEQA/ANzREQBERAEREApKQZb4jFKouxt3cz5TSc4wVydIyk26RcifNqgAuSAO+YXEbYY5IOHvOZ+Gkx1SozG7EnxN5ys/i+KG0Fb/AOFmGlnLnYz9batMaEn8o/ycpaPtk/dX4n/AmIlZy8ni2ol9LS+yLMdJBc7l+21qh04R5fWeP4pV94fASziVXrdQ/wB7+SVYIL0RefxSr7w+AnobWqDmD4j6SxiFrc6/e/kPDB+iMrT20fvKPI/4l3S2tTOt18Rl8RI/KSzj8V1EeXf3RFLSY3xsS2nVVhdSD4G8+gkQVyDdSQeoNpndk12ZSXN7Gw6987Gi8SWol0NUyrm07xq72MpExWE25h6lV8OlVTVpNwumjggA5KdRmMxcctZlBOqVisREAREQBERAEREAREQBERAPJnhmsLnKezMRtmnUIuua8wNfE9RINRleLG5JXRtCPVJK6PON2tqtP4/QTEu5JuSSepnmVnkdRq8ueVyf49Dq48UYLYRESoTCIiAIiIAiIgCIiAUMz4rLh8M1R8lpozt5AsZhcJT4nVepz8NTMf6Xtqeq2e1NTZq7LSFteHNn56WThOvtAc56DwPDbc/wUNZLiP5NFVsa7VWxHEyuztU4lYhld2LEhhYg3Oomydz/AErOlqW0bumgrKvbX86gdod4F/GatieocU0cxSaOs8JiqdRFqUmV0YXVkIZSO4jKXE5m3S3wxGAe9M8dNiOKkxPA2eZT3W17Q8wZ0Fu9t+hjKQrYZ+IaMDk6Na/Cy8j8jqLiQyi4kidmYiImpkREQBERAEREApLLam0aeHpPXrNwoi8RPPuAHMnIAcyZc1KgUEsbAC5J0AGpJmhd/t7Gxtbgpsfs9M2QXNnOd6rDv0AOg8TNoRcnRrKVIv29J+K+0muqj1FuEUCQBwi9mLgEh+pFxysbXm1939vUMZT9bh2uBkynJka3ssvI94yPImc2S82XtKrhqq18OxR1yuNCDqrDRlOWR6A6gGWJ4U1sRRyNPc6Jx+zAbsmR5jkfDoZhGBBsRYiNzN+KONApNaniADdL3VgNWptzH9JzFjqBeSPG4Fagvo3I/wCD1E85r/ClO549n29GdDBqenZ7ojkT6YigynhYfQ+E+c81OEoNxkqaOnGSkrQiImpkREQBERAEREAyWxKV3Z+gt5n/APPnNWemvafHiqeGByopxMOXHVIOfeFVf3d83Bsmnw0wT97M+HL5Cc07x7S+0YqviL3FSoxU6di9kGg+6FGk9t4Xh8vCl7X8nF1M+qb+DGRETqFYTL7tbwVsFWFege50PsOl81b/AAdQfO+IiYasHUe7O3aWNw64ijo2TKbcSMPaRu8fMEHnMxOZty96HwGIFVbtTbs1UByZfeA95dQfEc50jgsWlVEq02DI6hlI0KsLgyCUaZKnZcxETUyIiIAlLysxu3tqJhqFTE1NEW9veY5Ko7ySB5wDX3pa3n4V/h9Fu0wDViDmqGxWn4tkT/Tlo01NPvjsY9ao9aq3E7sXY956DkBoByAE+EuQj0qirKVuxERNzB6RyCGUkEG4IJBBGhBGYPfNq7lekkHhw+0GAOi1yAFOlhUt7J17WnW2p1RE1lBSW5mMnHg6jrUVdbMLj/2YMwGNwLU89V6/XpNX7l7+1cJajW4qmH6avTvzpknNf6D1ytod07Px1LEUxVoutRG0ZTcHqD0I5g5icfXeHRzLfZ+jL2DUOPHHYjcrMnjtmEdqnmOY5jw6zGTyWo009PKpr/GdXHljNWhERK5IIiIAlUTiIUak2+MpL7Y9LiqXOii/noJPpsXm5Yx7sjyS6YNny3/2j9m2dXdcmKeqX81SyD4XJ8pzYBNuenLaf/xsICNWrsOYsPV0+eQPFU1HLxmo577FGo7HDm9xERJTQREQBNm+h/er1VT+H1mslRr0ixySodUz0Dch73e01lPSOVIZSVZSGBGoINwQeoIvNZRtUZTpnXMrI3uLvAMbhErkjjHYqAcqigcWXIG4YdzSSSuSiIiAUmofTHtviengkbJP5tQD3iCKanwBLW/qU8hfbVaoFUsxsACSegAuTOZds7RbEV6uJa/8x2YX1Ck9hbDovCPLzkuGNyvsR5JUqLKIiWiAREQBERAEzO7e8lfBPx0Gup9tGuUcZagaNlkwzHeMphomGk1TCdHRe7O9FDHJxUWs4HbpsRxpyuRzXowy88peY7ZoftLkfkf+5zhgcbUoutWi7I66Mpse8d4PMHIzc+5W/wDTxXDQxFqeI5ckqfkJOTf0nyvyo6rRxyRakrX9FnFmcXa5L10KkqwsRyM8yS4zCLUGevIjUf8AUj+JwzIbMPAjQzyGs8Pngdrdd+33Oth1Cns+T5RETnFkTN7EpWUsfvH5D/xmEmY2vjRhMHUrH/SpMwHVgvZHmbDznZ8Gw9WZzfov+sp6yVRUe5oT0jbT+0bQruDdUb1K/lp9k8+bcZ85GJUknMkknMk5kk6knmZSewSpUch8iIiZAiIgCIiAT/0P7d9RjDhnayYkcIB0FVc0I5C44l7zw9JvyckUKzIy1EPCyMHVhyZTdT8ROqNi7QXEUKWJT2aqK4HTiAJB7xmPKQ5FTskiy/iLxIrNiK+kfaHqdn1iDZqgFJc7G9Q8JtnqF4jl0nP0236asXanhqGfbdqnK38tVXPv/mfIzUkt4VUbIMj3ERElIxERAEREAREQBLnAYKpWqJRoqXdzZVGWet78gNSeVrz54bDvUdadNC7uQqquZYnQD68tTlN57i7mpgk9ZUs2IcWdhoo9xO7qdSe6wkeSaijeEbM9u/gqtGhTpYis1aoo7TtqTra+pA0ucza5nz2xixb1YAJ593/c+u08dwjhU9o/IfWYK/OeX8U16SeGHL5fY6emwX+p8CIiecOkXGz6XFUUcgbnyzke9Ne0+DCU8MNa73P5aVnPL3jT5j+8l+wqXtP5D+5/xNM+l/afrceaam64dFp93G3bY+PaUfpnrvBsPRhT7uzk6udzrsQWIidwpCIiAIiIAiJ6RCxCqCWOQABJJ6ADMmAeZvj0M7R9ZgTRJuaFRkHXhbtrz07TDlpblIHu56L8ZiLPX/8A5kOfbF6pHdT+7+og9027upunh8AjLQ4yz8PG7sSW4OLhyHZUDibQDXO8inJNUbxTRIolLxIjc0t6ZsUDi6VPQpR4s9DxuwFv2fOa94x1E6irYKm54npoxta7KrG3S5E8/wAMofg0/wBifSTRzdMaoiljt3Zy/wAY6iOMdROoP4ZQ/Bp/sT6R/DKH4NP9ifSZ8/2MeV7nL/GOojjHUTqD+GUPwaf7E+kfwyh+DT/Yn0jz/YeV7nL/ABjqI4x1E6g/hlD8Gn+xPpH8Mofg0/2J9I8/2Hle5y/xjqJ7ooXYIgLMxCqq5sxOQAAzJnTv8Mofg0/2J9J6TAUlIZaaKRoVRQR4ECPP9h5XuQ/0fblDBr6+uAcQy2tkVpKdVU826t5DLMynaWN4Bwj2jp3d5l5W4uE8NuK2V9LyLVw1zx3vzvON4pq54ofpTt+vYu6bFGT34R5ZiSSTcmUiJ5JtvdnWSERPph6fEyr1Py5zMIOclFeuxiTpWZqg60aBqOQFRS7EkAAAFiSdBYCcwbRxhrVXrv7VR2c66sxNsyche2vKb89K20vUbOqKDZqxWivg2b/7Vf4znqe/0uNQxqK9FRwcjt2IiJZIxES82ZsuviX9XhqT1HyuFFwt9CzaKO8kRYLOfbC4V6jinSR3c6KilmP6Vzm1N3fRASRUx9UAamlR18Gqn5gDnk3XYeHw2CwCcNNadFTyUdtz3/ec+N5G59jbp9Wat3e9EuIqWbGsKCa8CFXqnu4s1T/d4TZmyN38Ds9C1NEp+9Uc3du7jOf6RYd0xO099GN1w68I998z5LoPO/hIticS9RuKozM3VjfyHQdwjplLkjlmjH6dyY7T30UXXDrxH3nuF8l1PnaY7dzatWpjENV2biDgDRQeEnJRkNJGpld1ssXRP9TfNGEy4JRZCskpTVm0oiJAXdyIbx4iotayuyjhBsrMBqeQ8Ji/t9b8V/3t9Zk97EtVVuqf2J+swc5uWUlN7ne0uOEsKbS+C5+31vxX/e31j7fW/Ff97fWW0SPrl3LHk4/4r4Ln7fW/Ff8Ae31j7fW/Ff8Ae31ltEdcu48nH/FfBc/b634r/vb6x9vrfiv+9vrLaJnrl3Hk4/4r4Ln7fW/Fqfub6yqbRrAgiq+XVmI+ByMtYjzJdx5OP+K+CW7J2+r2SrZW0v8Adb6GZbE4ZXFmF+h5jwM15Mxsrbr07K92T/cvgeY7pPHLGcenIrTOfqNE4vrxfH+F9i8C1PM5r1H+ektJKcPXSovEpBU/+sRMdjdlfep/D6fScnWeFNfrw7rsRYtV+2fJiJktiUruWP3R8zl9ZjWFsjkR1mf2PT4afEcrkny0H9pW8Mw9eoV+m5vqZ1j+5qX037U4sRRwo9mmhqN+aoSo5cgnX701hMxvbtP7TjcRiOTVDw/kSyIf2osut39ysbjLGlSKof8AUq3VLdRccTfpBntI1GO5yHuyOzL7B3axWMNsNSZgDYuezTXxc5eQue6bg3e9FWEoEPiScS/Rhw0h3imDn+okd0kuO2/hsMvq0sSo4QlMCy25ZdlbdNe6Yc72iGlFXJkL3c9ElJLVMc/rW14EJWmD0Le0/wDt8JNquMwmCpikgSmF0p0lUHP+kZAnqbX6yI7S3qr1bhD6teintHxfX4WmBJ5x0N7shlnS+lEm2pvhVfs0R6teuRc/4Xy+MjdSozEs5LMdSxJJ8SczKRJIxS4IJTlLliIibGgmV3VF8XR/M3ypsZipm9zafFikPuhm/wBpGfxmsvpZvj+tGzIiJUOgRve+l2UfoSvd2hf/AIyLycbw0OKg1tV7Q/Tr8ryDyhqY1KzueHzvFXZiIiVy+IiIAiIgCIiAIiIBcYPGPSbiRrdRyPiOcl+y9spV7Pst0PPwPOQiAbZiTY80o/YqajSwy78PuT/GYFXHQ9Rr59Z5x2GdqD0aTBHZCisQSFJXhDWBzI1tflLHdvHPUDB8+GwDcze+R66azOmXMeOF+ZFU2cTKpRfRJ8EK3e9HOBwlnZTWqKPbrEEL3qnsjTUgkdZkdpb2UKfZp/zGHu+wP1aHyvI7vZTxSt/PYtTJ7JXsp4FeTeN/GR6XIwvdsozzNOkqMrtPeHEVrhm4FP3V7I8zq3mbd0xAnqJKklwVpScuRERMmBERAEREASVej+herUqe6gX97X/4SKzYW4uF4cOXOrsT5L2R/Y/GR5HUSbBG5EliViVy7TPnUQEEHnl5Ga7xdAo7IfusR5cj8LTZEie9eDsy1gMmybxGhPll5CV9TG432L+hy9GSn6keiInPO4IiIAiIgCIiAIiIAiJ7o0ixVRqSF+JtMpWat0rJlu1Q4KCnm12PgdPkBNe7/wC99fD7QRcM9hRQB1NyjtU7RDrlew4LEG4ubWzE2mOFE6Kq+AAA/wCpzPtfHnEV6uIP+o7OOVlLHgHkOEeU7WCC47Hls+RuTl3ZvXdjevDbQplLBanD26L2J4dCQfvpnr8QJit4N1GS9TDgumpXV1/L7w+Y75pejWZGV0YqykMrKbMrDQgjSbc3L9I6VeHD44hKmQWrpTc5+1yRtM9CemQkkoOO6IX0zVPkwUTYG392FrXqUbLU1I0VudzbRu/nzkDxGHZGKOpVhqDrNoyTK08bi9z5xETcjEREAREQCtOmWIVRdmIAHUk2Am3cBhhTppTXRVC+NhmfPWQLcvZ/HX9aw7NMXz04z7PwzPdYTY8r5HvRc08aVlIlZWRFgpLXHYUVEZDzHwPIy6lIavYym07RratTKsUYWKmx8RPEk28+zb/z0GYybvHJvL+3hIzOZkh0So9DpsyywTX5EREjLAiIgCIiAIiIAmY3Yw/FW4jooJ8zkP7n4TDyXbqYbhplzqx+QyHzvJsCuaKetn0YX77Fl6R9p+owFUg2apaiued6lw1s9Qoc+U0BNnemfaV6lDCj7qmswz1YlE+S1Pj8dYzuYY1GzzOR2xERJTQnO5npAqYXho4niq0NAdalPQDhJPaQe7y5aWO1MRhsNj6K1EZWUg8FRDmOR+B1U9ORnOUzW7e8mIwT8dBrqSOOm2aOB3fdbowz8RlIp473jybxl6S4JxtjZFTDtw1BdT7LD2W+h7j85YTYW7+8WG2jSKrbisPWUm9pf/st9GHTkcpgNv7rvSvUo3anqRq6db29pR1169ZpGfpIjyYa3jwRyJ5nqSlcQqkkAC5JsAOZOgiSncvY/G32moOyhst+bDU+A/v4TWUqVm8IuTpEq3f2b6iiqH2j2m/MdfhkPKZWUlZVbs6CSSpCJWIMiUlYgHzdQQQeeUhG29mGi11HYbQ9D7p/xJzPhisOrqUYXBFj/wBSLLjU1XqT6fO8Mr9PU11Evtp7Oai1jmp9luvcehljOdKLi6Z6DHkjkj1R4ERE1NxERAEREAAE5DU5Dxmw8DRCU0QfdUD5ayG7Cw/HXQHRe0f05j52kg3s2n9mwdeuDZlQhfzt2U5jmR3y7pI7NnH8RyfqUO25ovfDaP2jG4it90uUW2nBT/lqfMLfzmEhVsLDllE7KVKjhN3uIiJkCIiAfbC4l6TrVpMyOpuGU2ZSRY2Pna3Obi3L9IiYjhoYvhp1tA1+GnVOQAF/Zck+zoeRzsNLwRymk4KXJtGTRv7b+6oe9TD2V9Suise7krfI92sg1akyMUcFWU2IOoInz3L9Ij0OGhjC1SjkFfNqlPP73N1/3C2V9Bs3HbNw+NprVVgeJQUqJnkcx4jPQ/KQ3KDpieJS3jyQXYWyWxFQILhBm7dB0HedB8eU2jh6KooRQAqiwA5AS32Vs5KCCmmgzJOrMdWMvppKXUyTFj6V7iViJoSiIiAIiIAlDKxALXE4VXUo4uD/AOy6GQ7a2yGom4uyXybmO5vrJzPLoCCCLg9ZFkxKa35J8Golhe3HY1rEk21N3dWoftOn6Ty8JG6lNlJVgQRqCLGUJ45Re528OohlVp/g8xESMsCIiDBJ90cPk9S2pCjyzP8AcfCRb0zbS4aVDDLftuajflpgBQfEvf8AT4TYGx8NwUVU62ufE5n+9po30lbR9dj6tjdaQWiv6Ll+XvM3w8J2dLCqXY8xq8nVKUu7IrERLxSEREAREQBE906ZZgiqWZjYKoLMx6KozJ7hNkbqejBntV2hdF5UlPbbL77L7I7lN+8TWU1HkzGLlwRTdTdOvjntTHBSUjiqsOyM81T3n1yGnMi4vvbYOw6OEpCjh14VBJNzdmY6sx5k/AaCwl9hcKlNFp01VEUWVVACgdABPvKs5uRPGKiViImhuIiIAiIgCIiAIiIAlJWIBQyzxmBSoLOoPQ8x4EZiXkTDSezMpuLtERx27Ti5pNxD3Wyb46H5TCV6DKeF1KnvFvh1myJ8qlIMLEAjoRcSvLTRfGxdxa+cNpb/ANmuJc7NocdVF6sL+AzPyBksxG79BtFKH+g2+RynnZuw1ouXDFsrAEWIva5uNdOkijpmpK+CzPXwlB1adF3tbHLQoVK7+zTRnPfwgmw7zoPGczVKjMxdzdmJZj1Zjdj8SZ0Fv5s7EYjCNh8KFLOyhuJuEcCniIv3kAW6EzVVX0bbRUX9Ujdy1Fv87TqYXFJ2zhZE29iHxJfS9G+0W1pIv5qif8SZcUvRbtBr39QlveqNn4cKNJuuPcj6JdiERNo4P0RPcGtilAyuKdMk2+8AzNl3Gx8JI9nejPAU83Rqzdajnh7+yth8b6TV5oo2WORpHCYV6r+rpI7vrwopZrXAvYaDMZ98nWwvRbiahDYp1oJ7os9U92XZXxufCbhweCp0l4KKJTUaKiqq/BRaXUilmk+CRY0uTB7A3XwuEFsPTAYixdu1UbxY6DuFh3TOCIkTd8m6VFYiIMiIiAIiIAiIgCIiAIiIAiIgCIiAUlIiB6gSkRBkrERCNQJSImTJ6lDETVgrErEARETIEREAREQBERAEREA//9k=" type="image/gif" sizes="16x16">
</head>
<body>
  <?php 
   include("link.html");
  ?>
  </div>
<div id="body"   @mouseover="position_mouse"> 

<?php    
 include("model/class/php/Class.php");  
$REMOTE_ADDR= $_SERVER['REMOTE_ADDR']; 



?>
<header>
    <?php        
        include("view/header.php");
    ?>
</header>
<section>
    <?php       
        include("view/section.php");
    ?>
</section>
<footer>
    <?php       
         include("view/footer.php");          
    ?>
</footer>

</div>
<script src="vue.js"></script>
<script src="model/class/js/bdd_exe_test.js"></script>
<?php 
if($config_==false){ 
echo '<link rel="stylesheet" href="model/css/remove_body.css">';
 }
?>
 

 <style>
     .taille-s {
         font-size:15px;
     }
 </style>

 <script>
 var footer = document.getElementsByTagName("footer");
     function  action_btn(this_){
        
         if(this_.title=='block'){
                document.getElementById('ist-display').className='display-block';
                
                footer[0].style.display="none";
         }
         else {
            document.getElementById('ist-display').className='display-none';
            footer[0].style.display="block";
         }
        
     }
     function eye_change(this_){
         if(this_.className=="fa fa-eye-slash eye-position"){
            document.getElementById("eye").className="fa fa-eye eye-position";
            
            document.getElementById("input_password").type="text";
         }
         else{
            document.getElementById("eye").className="fa fa-eye-slash eye-position";
            document.getElementById("input_password").type="password";
         }
         
     }





     function inscription(_this){



          var prenom =        document.getElementById("prenom").value; 
          var nom =       document.getElementById("nom").value; 
          var mobile_mail =       document.getElementById("mobile_mail").value; 
          var password =      document.getElementById("password").value;                     
          var naissance =       document.getElementById("naissance").value; 
 

                    var ok = new Information("addlogin.php"); // création de la classe 

ok.add("prenom", prenom); // ajout de l'information pour lenvoi 

ok.add("nom", nom); // ajout de l'information pour lenvoi 

ok.add("mobile_mail", mobile_mail); // ajout de l'information pour lenvoi 

ok.add("password", password); // ajout de l'information pour lenvoi 

ok.add("naissance", naissance); // ajout de l'information pour lenvoi 
  


console.log(ok.info()); // demande l'information dans le tableau
ok.push(); // envoie l'information au code pkp 
               

               
 
//document.getElementById("ist-display").className="display-none"; 
document.getElementById("information-bdd").innerHTML="Chargement en cours ..."; 
var favix = 'https://icon-library.com/images/ok-icon-gif/ok-icon-gif-29.jpg';
var favia = 'data:image/jpeg;base64,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';
document.getElementById("favicon").href=favix ; 


document.getElementById("btn-ins").className="display-none" ; 
document.getElementById("moves-sr").className="spinner-border" ; 





  





setTimeout(function(){ 
  
    document.getElementById("btn-ins").className="btn-ins" ; 
    document.getElementById("moves-sr").className="display-none" ; 
    document.getElementById("information-bdd").innerHTML=""; 
    var favix = 'https://icon-library.com/images/ok-icon-gif/ok-icon-gif-29.jpg';
    document.getElementById("favicon").href=favia;
    document.location.reload();



     }, 3000);


     }



function connexion() {

    setTimeout(function(){ 
    
    document.location.reload();
    
    
    }, 100);
 
var input_password = document.getElementById("input_password").value ;
var mail_mobil = document.getElementById("mail_mobil").value ;

   
var ok = new Information("login.php"); // création de la classe 
ok.add("mail_mobil", input_password); // ajout de l'information pour lenvoi 
ok.add("passwords", mail_mobil); // ajout d'une deuxieme information denvoi  
console.log(ok.info()); // demande l'information dans le tableau
ok.push(); // envoie l'information au code pkp 

}


 </script>

 <style>
     #moves-sr{
         
         padding:15px;
         position:absolute; 
         left:50%; 
         top:-30px;
     }
 </style>




 
 
  <?php

if(isset($_SESSION['naissance'])){
    $ok = $_SESSION['naissance']; 

    ?>

<script>

var variable_js = '<?php echo $ok; ?>';


 </script>
 
    <?php 
}

if(isset( $_SESSION['user_login'] ))
{
    if($_SESSION['user_login']==true){

    }
 ?>

<meta http-equiv="refresh" content="0;url=user/index.php">
 <?php 
}


 ?>
 



</body>
</html>
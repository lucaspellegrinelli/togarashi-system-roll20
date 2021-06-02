function roll_n_dice(n, dice_sides, who, callback){
  if(n == 0){
      callback([]);
  }else{
      sendChat(who, `/roll ${n}d${dice_sides}`, null, {use_3d: true});
      
      let done = false;
      on("chat:message", function(msg){
          if (msg.type == "rollresult" && done === false){
              let roll = JSON.parse(msg.content);
              let roll_ints = [];
              done = true;
              
              roll.rolls[0].results.forEach(out => {
                  roll_ints.push(out.v);
              });
              
              callback(roll_ints);
          }
      });
  }
}

function count_in_rolls(roll, test){
  let count = 0;
  roll.forEach(r => { if (test(r)) count++; });
  return count;
}

function count_crit_err(roll){
  return count_in_rolls(roll, (x) => { return x == 1; })
}

function count_crit(roll, dice_sides, crit_sides){
  return count_in_rolls(roll, (x) => { return x >= (dice_sides - crit_sides + 1); })
}

function count_max(roll, dice_sides){
  return count_in_rolls(roll, (x) => { return x == dice_sides; })
}

function count_suc(roll, diff, modifier){
  return count_in_rolls(roll, (x) => { return ((x != 1) && ((x + modifier) >= diff)); })
}

let guarda_calc = function(rolls, bottom, upper, modifier, crit, who="API", callback=undefined){
  let ones = count_crit_err(rolls);
  let all_new_rows = [];
  
  rolls.sort((a, b) => a - b);
  for(let i = 0; i < ones; i++){
      for(let j = 0; j < rolls.length; j++){
          if(rolls[j] != 1 && (rolls[j] + modifier) >= bottom){
              rolls.splice(j, 1);
              break;
          }
      }
  }
  
  let output_generator = function(){
      let bottom_success = 0;
      let upper_success = 0;
      
      rolls.forEach(n => {
          if(n > 1){
              if(n + modifier >= upper) upper_success++;
              else if(n + modifier >= bottom) bottom_success++;
          }
      });
      
      callback({"upper": upper_success, "bottom": bottom_success}, all_new_rows);
  }
  
  let process_extra_rolls = function(new_rolls){
      rolls = rolls.concat(new_rolls);
      all_new_rows = all_new_rows.concat(new_rolls);
      maxs = count_max(new_rolls, 10);
      if(maxs > 0) roll_n_dice(maxs, 10, who, process_extra_rolls);
      else output_generator();
  }
  
  let n_reroll = count_crit(rolls, 10, crit);
  roll_n_dice(n_reroll, 10, who, process_extra_rolls);
}

let togarashi_roll = function (rolls, difficulty, dice_sides=10, crit_sides=1, modifier=0, who="API", callback=undefined){
  let ones = count_crit_err(rolls);
  let crit = count_crit(rolls, dice_sides, crit_sides);
  let suc = count_suc(rolls, difficulty, modifier);
  let maxs = crit_sides == 0 ? 0 : count_max(rolls, dice_sides);
  let non_max_suc = suc - maxs;
  let del_max = Math.max(0, ones - non_max_suc);
  let n_reroll = maxs - del_max;
  
  let extra_rolls = [];
  let process_extra_rolls = function(new_rolls){
      extra_rolls = extra_rolls.concat(new_rolls);
      crit += count_crit(new_rolls, dice_sides, crit_sides);
      suc += count_suc(new_rolls, difficulty, modifier);
      maxs = count_max(new_rolls, dice_sides);
      
      if(maxs > 0) roll_n_dice(maxs, dice_sides, who, process_extra_rolls);
      else callback({"sucessos": suc - ones, "crit": crit, "rolagem": rolls, "extra": extra_rolls});
  }
  
  if(n_reroll > 0) roll_n_dice(n_reroll, dice_sides, who, process_extra_rolls);
  else callback({"sucessos": suc - ones, "crit": crit, "rolagem": rolls, "extra": extra_rolls});
}
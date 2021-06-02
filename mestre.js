/*
    Entrada da função:
     - suc_cima: Número de sucessos na guarda de cima
     - suc_baixo: Número de sucessos na guarda de baixo
     - tipo_dano: String contendo todos os tipos de dano aquele ataque dá (por exemplo "Impacto|Cortante")
     - dano_por_suc: Dano por sucesso antes de passar pelos blocks
     - forca_def: Força do defensor
     - escudo_aura: Quanto de resistência o escudo de aura utilizado tem (será 0 caso o defensor não tenha usado Escudo de aura)
     - arma_block_def: Quanto de block a arma do defensor tem (será 0 caso ele não tenha usado "Bloquear")
     - outros_block_def: Quanto de block gerado por técnicas o defensor tem
     - armadura_block_def: Quanto de block a armadura do defensor tem (será 0 caso ele não tenha uma armadura)
    
    Saída da função:
     - Dano na guarda de cima do oponente
     - Dano na guarda de baixo do oponente
     - Dano total causado ao oponente
     - Dano causado à arma do defensor caso ele utilize "Bloquear"
     - Dano causado à arma do atacante caso ele esteja utilizando uma arma
     - Dano causado à armadura do defensor caso ele esteja utilizando uma
*/
let calcular_dano = function(suc_cima, suc_baixo, tipo_dano, dano_por_suc, forca_def, escudo_aura, arma_block_def, outros_block_def, armadura_block_def){
  // Definindo as variáveis que vao tomar conta de quanto de dano será dado
  // à arma e armadura do defensor.
  var dano_resist_arma_def = 0;
  var dano_resist_armadura_def = 0;
  var dano_por_suc_c = dano_por_suc;
  
  // Se a arma possuí dano perfurante, diminua pela metade o block da armadura
  if(tipo_dano.includes("Perfurante")){
      armadura_block_def = Math.round(armadura_block_def / 2);
  }
  
  // Se o defensor usou "Bloquear", tire a quantidade de block da arma do
  // dano por sucesso e tire resistência da arma utilizada
  if(arma_block_def > 0){
      var dano_bloqueado = Math.min(dano_por_suc, arma_block_def); // Quanto de dano foi bloqueado pela arma
      dano_por_suc = dano_por_suc - dano_bloqueado; // Tirando do "dano por sucesso" a quantidade de dano bloqueado
      dano_resist_arma_def = Math.round(dano_bloqueado * suc_cima + dano_bloqueado * suc_baixo * 0.5); // Definindo o dano à arma do defensor que usou "Bloquear"
  }
  
  // Se o defensor usou alguma ténica que dá block para ele, tire essa quantidade
  // de block do dano por sucesso do ataque.
  if(outros_block_def > 0){
      var dano_bloqueado = Math.min(dano_por_suc, outros_block_def); // Quanto de dano foi bloqueado pelo block das técnicas
      dano_por_suc = dano_por_suc - dano_bloqueado; // Tirando do "dano por sucesso" a quantidade de dano bloqueado
  }
  
  // Se o defensor está usando uma armadura, tire a quantidade de block da armadrua do
  // dano por sucesso e tire resistência da armadura utilizada
  if(armadura_block_def > 0){
      var dano_bloqueado = Math.min(dano_por_suc, armadura_block_def); // Quanto de dano foi bloqueado pela armadura
      dano_por_suc = dano_por_suc - dano_bloqueado; // Tirando do "dano por sucesso" a quantidade de dano bloqueado
      dano_resist_armadura_def = Math.round(dano_bloqueado * suc_cima + dano_bloqueado * suc_baixo * 0.5); // Definindo o dano à armadura do defensor
  }
  
  // Calcula o dano em cada uma das guardas
  var dano_cima = dano_por_suc * suc_cima;
  var dano_baixo = Math.round(dano_por_suc * suc_baixo * 0.5);
  
  // Calcula o dano total causado ao oponente
  var dano_total = dano_cima + dano_baixo;
  
  // Se o defensor usou "Escudo de Aura", tire a quantidade de block da arma do
  // dano por sucesso e tire resistência da arma utilizada
  if(escudo_aura > 0){
      var dano_bloqueado = Math.min(dano_total, escudo_aura); // Quanto de dano foi bloqueado pelo escudo de aura
      dano_total = dano_total - dano_bloqueado; // Tirando do "dano por sucesso" a quantidade de dano bloqueado
  }
  
  // Calcula o dano que será causado à arma do atacante
  var dano_resist_arma_atk = Math.round(dano_por_suc_c * 0.5);
  
  // Se a arma possuí dano de impacto, dobre a quantidade de dano causado à armadura
  if(tipo_dano.includes("Impacto")){
      dano_resist_armadura_def = dano_resist_armadura_def * 2;
  }
  
  // Retorne as informações calculadas
  return {
      "dano_cima": dano_cima,
      "dano_baixo": dano_baixo,
      "dano_total": dano_total,
      "dano_resist_arma_def": dano_resist_arma_def,
      "dano_resist_arma_atk": dano_resist_arma_atk,
      "dano_resist_armadura_def": dano_resist_armadura_def
  }
}

// Calcula o quanto de escudo um escudo de aura dá e quanto de aura esse escudo
// gastará, ambos baseados no rank da aura.
let calcular_escudo_de_aura = function(rank, is_laranja, is_corpo){
  if(is_corpo && is_laranja){
      if(rank == "S") return { "escudo": 25, "aura": 75 };
      if(rank == "A") return { "escudo": 20, "aura": 100 };
      if(rank == "B") return { "escudo": 14, "aura": 125 };
      if(rank == "C") return { "escudo": 10, "aura": 150 };
      if(rank == "D") return { "escudo": 6, "aura": 175 };
      if(rank == "E") return { "escudo": 3, "aura": 200 };
  }
  
  if(is_corpo && !is_laranja){
      if(rank == "S") return { "escudo": 25, "aura": 75 };
      if(rank == "A") return { "escudo": 20, "aura": 100 };
      if(rank == "B") return { "escudo": 14, "aura": 125 };
      if(rank == "C") return { "escudo": 10, "aura": 150 };
      if(rank == "D") return { "escudo": 6, "aura": 175 };
      if(rank == "E") return { "escudo": 3, "aura": 200 };
  }
  
  if(!is_corpo && is_laranja){
      if(rank == "S") return { "escudo": 25, "aura": 75 };
      if(rank == "A") return { "escudo": 20, "aura": 100 };
      if(rank == "B") return { "escudo": 14, "aura": 125 };
      if(rank == "C") return { "escudo": 10, "aura": 150 };
      if(rank == "D") return { "escudo": 6, "aura": 175 };
      if(rank == "E") return { "escudo": 3, "aura": 200 };
  }
  
  if(!is_corpo && !is_laranja){
      if(rank == "S") return { "escudo": 25, "aura": 75 };
      if(rank == "A") return { "escudo": 20, "aura": 100 };
      if(rank == "B") return { "escudo": 14, "aura": 125 };
      if(rank == "C") return { "escudo": 10, "aura": 150 };
      if(rank == "D") return { "escudo": 6, "aura": 175 };
      if(rank == "E") return { "escudo": 3, "aura": 200 };
  }
}

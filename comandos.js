/*
    TODO
     . Dual Wield (?)
     . Whisper com o erro crítico
*/

let last_turn_order = "";

let commands = {
    "!ataque": function(args, who){
        let id_from = args[0];
        let id_to = args[1];
        
        let tipo_dano = args[2] != "nd" ? args[2] : undefined;
        let acerto = args[3] != "nd" ? parseInt(args[3]) : 0;
        let dano = args[4] != "nd" ? parseInt(args[4]) : 0;
        let critico = args[5] != "nd" ? parseFloat(args[5]) : 0;
        
        let usar_arma = args[6] == "sim";
        let aplicar_efeitos = args[7] == "sim";
        
        let vantagem = 0;
        if(args[8] == "vantagem") vantagem = 1;
        else if(args[8] == "desvantagem") vantagem = -1;
        
        let salvar_macro = args[9] == "sim";
        
        attack(id_from=id_from, id_to=id_to, dano=dano, tipo_dano=tipo_dano, acerto=acerto,
               critico=critico, vantagem=vantagem, who=who, usar_arma=usar_arma,
               aplicar_efeitos=aplicar_efeitos);
               
        if(salvar_macro){
            let macro_name = "zzz-Macro-Do-Ataque";
            let macro_action = `!ataque @{selected|character_id} @{target|character_id} ${args[2]} ${args[3]} ${args[4]} ${args[5]} ${args[6]} ${args[7]} ${args[8]} nao\n/roll @{selected|Destreza}d10`;
            create_macro_in_character(id_from, macro_name, macro_action);
        }
    },
    "!block_com_arma": function(args, who){
        let char_id = args[0];
        let character = getObj("character", char_id);
        let char_weapon = get_char_curr_weapon(character.id);
        
        if(char_weapon){
            process_roll_dic(0, (msg, roll_ints) => {
                togarashi_roll(rolls=roll_ints, difficulty=6, dice_sides=10, crit_sides=0, modifier=0, who=who, callback=function(result){
                    if(result["sucessos"] >= 1){
                        let modif = parseInt(char_weapon.info.Block);
                        let status_eff = { 
                            id: "-1", pr: 0,
                            custom: `Block +${Math.max(0, modif)} [${character.get("name")}]`,
                            formula: "-1", attr: "Block", modifier: modif, char_id: char_id
                        }
                        
                        add_item_to_turn_order(status_eff, front=true);
                        StatusManager.apply_status_effect(status_eff, undo=false);
                        
                        sendChat("API", `${character.get("name")} conseguiu utilizar Bloquear`);
                    }else{
                        sendChat("API", `${character.get("name")} não conseguiu utilizar Bloquear`);
                    }
                });
            });
        }else{
            sendChat("API", `${character.get("name")} não está segurando nenhuma arma logo não conseguiu utilizar Bloquear`);
        }
    },
    "!escudo_de_aura": function(args, who){
        let char_id = args[0];
        let is_laranja = args[1] == "sim";
        let character = getObj("character", char_id);
        
        process_roll_dic(0, (msg, roll_ints) => {
            togarashi_roll(rolls=roll_ints, difficulty=6, dice_sides=10, crit_sides=0, modifier=0, who=who, callback=function(result){
                create_attribute_if_not_exists(character.id, "Rank Aura", "C");
                let char_aura_rank = getAttrByName(character.id, "Rank Aura");

                create_attribute_if_not_exists(character.id, "Escudo Aura", 0);
                let char_aura_shield = getAttrByName(character.id, "Escudo Aura");

                let aura_calc = calcular_escudo_de_aura(char_aura_rank, is_laranja, false);
                
                let aura_attr = findObjs({ _type: "attribute", name: "Aura", _characterid: character.id })[0];
                aura_attr.set("current", getAttrByName(character.id, "Aura") - aura_calc["aura"]);
                
                let aura_total_attr = findObjs({ _type: "attribute", name: "Aura Total", _characterid: character.id })[0];
                aura_total_attr.set("current", getAttrByName(character.id, "Aura Total") - aura_calc["aura"]);
                
                if(result["sucessos"] >= 1){
                    let status_eff = {
                        id: "-1", pr: 0,
                        custom: `Escudo Aura [${character.get("name")}]`,
                        formula: "-1", attr: "Escudo Aura", modifier: aura_calc["escudo"], char_id: char_id
                    }
                    
                    add_item_to_turn_order(status_eff, front=true);
                    StatusManager.apply_status_effect(status_eff, undo=false);
                    
                    sendChat("API", `${character.get("name")} conseguiu utilizar escudo de aura${is_laranja ? " de aura laranja" : ""}`);
                }else{
                    sendChat("API", `${character.get("name")} não conseguiu utilizar escudo de aura${is_laranja ? " de aura laranja" : ""}`);
                }
            });
        });
    },
    "!escudo_de_aura_corpo_inteiro": function(args, who){
        let char_id = args[0];
        let is_laranja = args[1] == "sim";
        let character = getObj("character", char_id);
        
        create_attribute_if_not_exists(character.id, "Rank Aura", "C");
        let char_aura_rank = getAttrByName(character.id, "Rank Aura");

        create_attribute_if_not_exists(character.id, "Escudo Aura", 0);
        let char_aura_shield = getAttrByName(character.id, "Escudo Aura");

        let aura_calc = calcular_escudo_de_aura(char_aura_rank, is_laranja, true);
        
        let status_eff = {
            id: "-1", pr: 0,
            custom: `Escudo Aura Corpo Inteiro [${character.get("name")}]`,
            formula: "-1", attr: "Escudo Aura", modifier: aura_calc["escudo"], char_id: char_id
        }
        
        add_item_to_turn_order(status_eff, front=true);
        StatusManager.apply_status_effect(status_eff, undo=false);
        
        let aura_attr = findObjs({ _type: "attribute", name: "Aura", _characterid: character.id })[0];
        aura_attr.set("current", getAttrByName(character.id, "Aura") - aura_calc["aura"]);
        
        let aura_total_attr = findObjs({ _type: "attribute", name: "Aura Total", _characterid: character.id })[0];
        aura_total_attr.set("current", getAttrByName(character.id, "Aura Total") - aura_calc["aura"]);
        
        sendChat("API", `${character.get("name")} usou escudo de aura de corpo inteiro`);
    },
    "!add_modificador": function(args, who){
        let char_id = args[0];
        let attr = args[1];
        let modif = parseInt(args[2]);
        let turns = parseInt(args[3]);
        let character = getObj("character", char_id);
        
        if(turns >= 0){
            let status_eff = {
                id: "-1", pr: turns,
                custom: `${attr} ${modif > 0 ? "+" : "-"} ${Math.abs(modif)} [${character.get("name")}]`,
                formula: "-1", attr: attr, modifier: modif, char_id: char_id
            }
            
            add_item_to_turn_order(status_eff);
            StatusManager.apply_status_effect(status_eff, undo=false);
        }
    },
    "!create_weapon": function(args, who){
        let token_id = args[0];
        let weapon_name = args[1];
        let material_name = args[2]
        let weapon = armas[weapon_name];
        let material = materiais[material_name];
        let token = getObj("graphic", token_id);
        
        if(weapon_name.startsWith("Arco") || weapon_name.startsWith("Besta")){
            material_name = "";
            material = { "Resistencia": 0, "Peso": 0, "Dano": 0, "Acerto": 0, "Block": 0, "Crit": 0 };
        }

        let weapon_stats = {
            "Nome": weapon_name,
            "Material": material_name,
            "TipoDano": weapon["Tipo_Dano"],
            "Dano": material["Dano"] + weapon["Dano"],
            "Acerto": material["Acerto"] + weapon["Acerto"],
            "Block": material["Block"],
            "Crit": (material["Crit"] + weapon["Crit"]).toFixed(1),
            "Id": Math.floor(Math.random() * (Number.MAX_SAFE_INTEGER - 1)).toString(36),
            "Owner": ""
        };
        
        let props = JSON.parse(JSON.stringify(token));
        props.left += 70;
        props.pageid = Campaign().get("playerpageid");
        props.name = `${weapon_name.replace("_", " ").replace("_", " ")} de ${material_name.replace("_", " ").replace("_", " ")}`;
        props.imgsrc = weapon.image.replace(/med|max/,'thumb');
        props.bar2_value = material["Peso"] + weapon["Peso"];
        props.bar2_max = material["Peso"] + weapon["Peso"];
        props.bar3_value = material["Resistencia"] + weapon["Resistencia"];
        props.bar3_max = material["Resistencia"] + weapon["Resistencia"];
        props.gmnotes = GMNotesEditor.create_gmnote_table(weapon_stats);
        let weapon_token = createObj("graphic", props);
    },
    "!create_armor": function(args, who){
        let token_id = args[0];
        let peso_name = args[1];
        let material_name = args[2];
        
        let armor = armaduras[material_name];
        let token = getObj("graphic", token_id);
        
        armor["Peso"] += peso_name == "Leve" ? 10 : 20;
        
        let armor_stats = {
            "Tipo": peso_name,
            "Material": material_name,
            "Block": armor[`Block${peso_name}`],
            "Id": Math.floor(Math.random() * (Number.MAX_SAFE_INTEGER - 1)).toString(36),
            "Owner": ""
        };
        
        let props = JSON.parse(JSON.stringify(token));
        props.left += 70;
        props.pageid = Campaign().get("playerpageid");
        props.name = `Armadura ${peso_name} de ${material_name.replace("_", " ").replace("_", " ")}`;
        props.imgsrc = armor.image.replace(/med|max/,'thumb');
        props.bar2_value = armor["Peso"];
        props.bar2_max = armor["Peso"];
        props.bar3_value = armor["Resistencia"];
        props.bar3_max = armor["Resistencia"];
        props.gmnotes = GMNotesEditor.create_gmnote_table(armor_stats);
        let armor_token = createObj("graphic", props);
    },
    "!assign_owner": function(args, who){
        let token_id = args[0];
        let char_id = args[1];
        let token = getObj("graphic", token_id);
        let character = getObj("character", char_id);
        let stat_updates = { "Owner": character.id };
        let new_gm_notes = GMNotesEditor.edit_stats_from_gmnotes(token.get("gmnotes"), stat_updates);
        token.set("gmnotes", new_gm_notes);
    },
    "!list_weapons": function(args, who){
        let char_id = args[0];
        let character = getObj("character", char_id);
        create_attribute_if_not_exists(character.id, "Id_Arma", "");
        let weapon_attr = getAttrByName(character.id, "Id_Arma");
        let weapons = get_char_all_weapons(char_id);
        
        let display = `&{template:default}{{name=Armas de ${character.get("name")}}}`;
        weapons.forEach(e => {
            display += `{{${e.name}=[Mostrar](!show_weapon ${char_id} ${e.info.Id})}}`;
        });
        
        sendChat("Armas", `/w ${who} ${display}`);
    },
    "!show_curr_weapon": function(args, who){
        let char_id = args[0];
        let character = getObj("character", char_id);
        
        create_attribute_if_not_exists(character.id, "Id_Arma", "");
        let weapon_attr = getAttrByName(character.id, "Id_Arma");
        
        let e = get_char_curr_weapon(character.id);
        
        if(e){
            if(weapon_attr == e.info.Id){
                var button = `[Desequipar](!deassign_main_weapon ${char_id})`;
            }else{
                var button = `[Equipar](!assign_main_weapon ${char_id} ${e.info.Id})`;
            }
            
            if(e.info.Nome == "Alabarda" || e.info.Nome == "Katar"){
                var button2 = `{{Selecionar Tipo Dano=[Cortante](!change_curr_weapon_damage_type ${char_id} cortante)[Perfurante](!change_curr_weapon_damage_type ${char_id} perfurante)}}`;
            }else{
                var button2 = "";
            }
            
            let display = `&{template:default}{{name=${e.name}}}{{Tipo=${e.info.TipoDano}}}{{Dano=[[${e.info.Dano}]]}}{{Peso=[[${e.token.get("bar2_value")}]]}}{{Acerto=[[${e.info.Acerto}]]}}{{Crítico=[[${Math.round(e.info.Crit * 100)}]]%}}{{Block=[[${e.info.Block}]]}}{{Ação=${button}}}${button2}`;
            sendChat("Armas", `/w ${who} ${display}`);
        }
    },
    "!list_armors": function(args, who){
        let char_id = args[0];
        let character = getObj("character", char_id);
        create_attribute_if_not_exists(character.id, "Id_Armadura", "");
        let weapon_attr = getAttrByName(character.id, "Id_Armadura");
        let weapons = get_char_all_armors(char_id);
        
        let display = `&{template:default}{{name=Armaduras de ${character.get("name")}}}`;
        weapons.forEach(e => {
            display += `{{${e.name.replace("Armadura ", "")}=[Mostrar](!show_armor ${char_id} ${e.info.Id})}}`;
        });
        
        sendChat("Armas", `/w ${who} ${display}`);
    },
    "!show_curr_armor": function(args, who){
        let char_id = args[0];
        let character = getObj("character", char_id);
        
        create_attribute_if_not_exists(character.id, "Id_Armadura", "");
        let armor_attr = getAttrByName(character.id, "Id_Armadura");
        
        let e = get_char_curr_armor(character.id);
        
        if(e){
            if(armor_attr == e.info.Id){
                var button = `[Desequipar](!deassign_main_armor ${char_id})`;
            }else{
                var button = `[Equipar](!assign_main_armor ${char_id} ${e.info.Id})`;
            }
            
            let display = `&{template:default}{{name=${e.name}}}{{Tipo=${e.info.Tipo}}}{{Block=[[${e.info.Block}]]}}{{Peso=[[${e.token.get("bar2_value")}]]}}{{Ação=${button}}}`;
            sendChat("Armaduras", `/w ${who} ${display}`);
        }
    },
    "!show_weapon": function(args, who){
        let char_id = args[0];
        let weapon_id = args[1];
        let character = getObj("character", char_id);
        create_attribute_if_not_exists(character.id, "Id_Arma", "");
        let weapon_attr = getAttrByName(character.id, "Id_Arma");
        let weapons = get_char_all_weapons(char_id);
        
        weapons.forEach(e => {
            if(e.info.Id == weapon_id){
                if(weapon_attr == e.info.Id) var button = `[Desequipar](!deassign_main_weapon ${char_id})`;
                else var button = `[Equipar](!assign_main_weapon ${char_id} ${e.info.Id})`;
                
                let display = `&{template:default}{{name=${e.name}}}{{Tipo=${e.info.TipoDano}}}{{Dano=[[${e.info.Dano}]]}}{{Peso=[[${e.token.get("bar2_value")}]]}}{{Acerto=[[${e.info.Acerto}]]}}{{Crítico=[[${Math.round(e.info.Crit * 100)}]]%}}{{Block=[[${e.info.Block}]]}}{{Ação=${button}}}`;
                sendChat("Armas", `/w ${who} ${display}`);
                return;
            }
        });
    },
    "!show_armor": function(args, who){
        let char_id = args[0];
        let armor_id = args[1];
        let character = getObj("character", char_id);
        create_attribute_if_not_exists(character.id, "Id_Armadura", "");
        let armor_attr = getAttrByName(character.id, "Id_Armadura");
        let armors = get_char_all_armors(char_id);
        
        armors.forEach(e => {
            if(e.info.Id == armor_id){
                if(armor_attr == e.info.Id) var button = `[Desequipar](!deassign_main_armor ${char_id})`;
                else var button = `[Equipar](!assign_main_armor ${char_id} ${e.info.Id})`;
                
                let display = `&{template:default}{{name=${e.name}}}{{Tipo=${e.info.Tipo}}}{{Block=[[${e.info.Block}]]}}{{Peso=[[${e.token.get("bar2_value")}]]}}{{Ação=${button}}}`;
                sendChat("Armas", `/w ${who} ${display}`);
                return;
            }
        });
    },
    "!assign_main_weapon": function(args, who){
        let char_id = args[0];
        let weapon_id = args[1];
        let character = getObj("character", char_id);
        let weapons = get_char_all_weapons(char_id);
        
        create_attribute_if_not_exists(character.id, "Id_Arma", "");
        let weapon_attr = findObjs({ _type: "attribute", name: "Id_Arma", _characterid: character.id })[0];
        weapon_attr.set("current", weapon_id);
        
        weapons.forEach(e => {
            if(e.info.Id == weapon_id){
                sendChat("API", `${character.get("name")} agora está segurando uma ${e.name}`);
            }
        });
    },
    "!deassign_main_weapon": function(args, who){
        let char_id = args[0];
        let character = getObj("character", char_id);
        
        create_attribute_if_not_exists(character.id, "Id_Arma", "");
        let weapon_attr = findObjs({ _type: "attribute", name: "Id_Arma", _characterid: character.id })[0];
        weapon_attr.set("current", "");
        sendChat("API", `${character.get("name")} agora não está segurando nenhuma arma`);
    },
    "!assign_main_armor": function(args, who){
        let char_id = args[0];
        let armor_id = args[1];
        let character = getObj("character", char_id);
        let armors = get_char_all_armors(char_id);
        
        create_attribute_if_not_exists(character.id, "Id_Armadura", "");
        let armor_attr = findObjs({ _type: "attribute", name: "Id_Armadura", _characterid: character.id })[0];
        armor_attr.set("current", armor_id);
        
        armors.forEach(e => {
            if(e.info.Id == armor_id){
                sendChat("API", `${character.get("name")} agora está vestido uma ${e.name}`);
            }
        });
    },
    "!deassign_main_armor": function(args, who){
        let char_id = args[0];
        let character = getObj("character", char_id);
        
        create_attribute_if_not_exists(character.id, "Id_Armadura", "");
        let armor_attr = findObjs({ _type: "attribute", name: "Id_Armadura", _characterid: character.id })[0];
        armor_attr.set("current", "");
        sendChat("API", `${character.get("name")} agora não está vestido nenhuma armadura`);
    },
    "!change_curr_weapon_damage_type": function(args, who){
        let char_id = args[0];
        let new_dmg_type = args[1];
        
        let character = getObj("character", char_id);
        let weapon = get_char_curr_weapon(char_id);
        
        if(weapon.info.Nome == "Alabarda" || weapon.info.Nome == "Katar"){
            if(new_dmg_type == "cortante" && weapon.info.TipoDano == "Perfurante"){
                let stat_updates = { "TipoDano": "Cortante", "Crit": (parseFloat(weapon.info.Crit) + 0.1).toFixed(1) };
                let new_gm_notes = GMNotesEditor.edit_stats_from_gmnotes(weapon.token.get("gmnotes"), stat_updates);
                weapon.token.set("gmnotes", new_gm_notes);
                sendChat("API", `A arma de ${character.get("name")} foi atualizada para o dano cortante`);
            }
            
            if(new_dmg_type == "perfurante" && weapon.info.TipoDano == "Cortante"){
                let stat_updates = { "TipoDano": "Perfurante", "Crit": (parseFloat(weapon.info.Crit) - 0.1).toFixed(1) };
                let new_gm_notes = GMNotesEditor.edit_stats_from_gmnotes(weapon.token.get("gmnotes"), stat_updates);
                weapon.token.set("gmnotes", new_gm_notes);
                sendChat("API", `A arma de ${character.get("name")} foi atualizada para o dano perfurante`);
            }
        }
    },
    "!gastaraura": function(args, who){
        let char_id = args[0];
        let qtde = parseInt(args[1]);
        let character = getObj("character", char_id);
        
        create_attribute_if_not_exists(character.id, "Aura", 0);
        let aura_attr = findObjs({ _type: "attribute", name: "Aura", _characterid: character.id })[0];
        aura_attr.set("current", getAttrByName(character.id, "Aura") - qtde);
        
        create_attribute_if_not_exists(character.id, "Aura Total", 0);
        let aura_total_attr = findObjs({ _type: "attribute", name: "Aura Total", _characterid: character.id })[0];
        aura_total_attr.set("current", getAttrByName(character.id, "Aura Total") - qtde);
    },
    "!add_pontos_elementais": function(args, who){
        let char_id = args[0];
        let qtde = parseInt(args[1]);
        let character = getObj("character", char_id);
        
        create_attribute_if_not_exists(character.id, "Pontos Elementais", 0);
        let attr = findObjs({ _type: "attribute", name: "Pontos Elementais", _characterid: character.id })[0];
        attr.set("current", getAttrByName(character.id, "Pontos Elementais") + qtde);
    },
    "!treino": function(args, who){
        let char_id = args[0];
        let dados = parseInt(args[1]);
        let vezes = parseInt(args[2]);
        
        let character = getObj("character", char_id);
        
        function process_day_roll(all_rolls, n, cumm){
            if(n < all_rolls.length){
                togarashi_roll(all_rolls[n], 6, 10, 1, 0, who, result => {
                    process_day_roll(all_rolls, n + 1, cumm + result["sucessos"]);
                });
            }else{
                let display = `&{template:default}{{name=Treino de ${character.get("name")}}}{{Dados=[[${dados}]]}}{{Vezes=[[${vezes}]]}}{{Sucessos=[[${cumm}]]}}`;
                sendChat("API", `${display}`);
            }
        }
        
        function roll_one_day(n, cumm){
            roll_n_dice(dados * vezes, 10, who, rolls => {
                let rolagens = [];
                
                for(let i = 0; i < rolls.length; i += dados){
                    let this_rolagem = [];
                    for(let j = i; j < i + dados; j++){
                        this_rolagem.push(rolls[j]);
                    }
                    
                    rolagens.push(this_rolagem);
                }
                
                process_day_roll(rolagens, 0, 0);
            });
        }
        
        roll_one_day(0, 0);
    }
};

let attack = function(id_from, id_to, dano, tipo_dano, acerto, critico, vantagem, who, usar_arma, aplicar_efeitos){
    log(`${dano} ${tipo_dano} ${acerto} ${critico} ${usar_arma} ${aplicar_efeitos}`);
    
    let from_char = getObj('character', id_from);
    let to_char = getObj('character', id_to);
    
    let from_weapon = get_char_curr_weapon(from_char.id);
    let to_weapon = get_char_curr_weapon(to_char.id);

    let from_armor = get_char_curr_armor(from_char.id);
    let to_armor = get_char_curr_armor(to_char.id);

    if(from_weapon && from_weapon.token.get("bar3_value") <= 0) from_weapon = undefined;
    if(to_weapon && to_weapon.token.get("bar3_value") <= 0) to_weapon = undefined;

    if(from_armor && from_armor.token.get("bar3_value") <= 0) from_armor = undefined;
    if(to_armor && to_armor.token.get("bar3_value") <= 0) to_armor = undefined;

    process_roll_dic(vantagem, (msg, roll_ints) => {
        create_attribute_if_not_exists(from_char.id, "Acerto", 0);
        let modificador = parseInt(getAttrByName(from_char.id, "Acerto")) + acerto;
        
        create_attribute_if_not_exists(to_char.id, "Block", 0);
        let block_def = parseInt(getAttrByName(to_char.id, "Block", "current"));
        
        create_attribute_if_not_exists(to_char.id, "BlockOutros", 0);
        let other_block_def = parseInt(getAttrByName(to_char.id, "BlockOutros", "current"));
        
        create_attribute_if_not_exists(from_char.id, "Dano", 0);
        let dano_mod = parseInt(getAttrByName(from_char.id, "Dano", "current"));
        
        let armor_block_def = to_armor ? parseInt(to_armor.info.Block) : 0;
        
        create_attribute_if_not_exists(to_char.id, "Escudo Aura", 0);
        let aura_shield = parseInt(getAttrByName(to_char.id, "Escudo Aura"));
        
        let guarda_baixo = parseInt(getAttrByName(to_char.id, "Guarda", "current"));
        let guarda_cima = parseInt(getAttrByName(to_char.id, "Guarda", "max"));
        
        let forca_def = parseInt(getAttrByName(to_char.id, "Força", "current"));
        let forca_atk = parseInt(getAttrByName(from_char.id, "Força", "current"));
        
        let resist_def = parseInt(getAttrByName(to_char.id, "Resistência", "current"));
        
        if(usar_arma && from_weapon){
            dano += parseInt(from_weapon.info.Dano);
            
            if(!from_weapon.name.startsWith("Besta")){
                dano += forca_atk;
            }
            
            modificador += parseInt(from_weapon.info.Acerto);
            critico += parseFloat(from_weapon.info.Crit);
            
            if(tipo_dano == undefined){
                tipo_dano = from_weapon.info.TipoDano;
            }
        }
        
        if(tipo_dano == undefined) tipo_dano = "Impacto";
        
        critico = Math.round(critico * 10);
        
        dano += dano_mod;
        guarda_calc(roll_ints, bottom=guarda_baixo, upper=guarda_cima, modifier=modificador, crit=critico, who=msg.who, callback=function(out, rerolls){
            let all_rolls = roll_ints.concat(rerolls);
            let danos = calcular_dano(out["upper"], out["bottom"], tipo_dano, dano, forca_def, aura_shield, block_def, other_block_def, armor_block_def);
            log(danos);
            
            if(aplicar_efeitos){
                let vida_attr = findObjs({ _type: "attribute", name: "Vida", _characterid: to_char.id })[0];
                vida_attr.set("current", getAttrByName(to_char.id, "Vida") - danos["dano_total"]);
                
                if(usar_arma && from_weapon){
                    from_weapon.token.set("bar3_value", from_weapon.token.get("bar3_value") - danos["dano_resist_arma_atk"]);
                }
                
                if(to_weapon && block_def > 0){
                    to_weapon.token.set("bar3_value", to_weapon.token.get("bar3_value") - danos["dano_resist_arma_def"]);
                }
                
                if(to_armor){
                    to_armor.token.set("bar3_value", to_armor.token.get("bar3_value") - danos["dano_resist_armadura_def"]);
                }
                
                if(danos["dano_total"] > 0 && from_weapon){
                    togarashi_roll(rolls=all_rolls, difficulty=guarda_baixo, dice_sides=10, crit_sides=0, modifier=modificador, who=who, callback=function(result){
                        if(tipo_dano.includes("Cortante") && result["sucessos"] >= 4){
                            if(aplicar_efeitos) StatusManager.add_debuff(to_char.id, "sangramento");
                            sendChat("Deus", `/w gm Foi causado sangramento`);
                        }
                        
                        if(tipo_dano.includes("Impacto") && result["sucessos"] >= resist_def){
                            if(aplicar_efeitos){
                                let vida_attr = findObjs({ _type: "attribute", name: "Vida", _characterid: to_char.id })[0];
                                vida_attr.set("current", getAttrByName(to_char.id, "Vida") - 10);
                            }
                            
                            sendChat("Deus", `/w gm Foi causado uma lesão`);
                        }
                    });
                }
            }
            
            let display = `&{template:default} {{name= Ataque de ${from_char.get("name")} em ${to_char.get("name")}}} {{Acerto = [[${modificador}]]}} {{Dano = [[${dano}]]}} {{Guarda de Baixo = [[${guarda_baixo}]]}}{{Guarda de Cima = [[${guarda_cima}]]}} {{Sucessos Guarda Baixo = [[${out["bottom"]}]]}} {{Sucessos Guarda Cima = [[${out["upper"]}]]}} {{Dano Guarda Baixo = [[${danos["dano_baixo"]}]]}} {{Dano Guarda Cima = [[${danos["dano_cima"]}]]}} {{Dano Total = [[${danos["dano_total"]}]]}}`;
            
            if(aplicar_efeitos){
                if(usar_arma && from_weapon && danos["dano_resist_arma_atk"] > 0){
                    display += `{{Dano na arma do atk. = [[${danos["dano_resist_arma_atk"]}]]}}`;
                }
                
                if(to_weapon && danos["dano_resist_arma_def"] > 0){
                    display += `{{Dano na arma do def. = [[${danos["dano_resist_arma_def"]}]]}}`;
                }
                
                if(to_armor && danos["dano_resist_armadura_def"] > 0){
                    display += `{{Dano na armadura = [[${danos["dano_resist_armadura_def"]}]]}}`;
                }
            }
            
            sendChat("Deus", `/w gm ${display}`);
        });
    });
}

// ------------- TOGARASHI HELPER -------------
let get_stats_influenced_by = function(stat_name, modifier){
    if(stat_name == "Destreza"){
        return [
            { name: "Destreza", mod: modifier, which: "current" },
            { name: "Guarda", mod: modifier, which: "current" },
            { name: "Guarda", mod: modifier, which: "max" }
        ];
    }else if(stat_name == "GuardaCima"){
        return [{ name: "Guarda", mod: modifier, which: "max" }];
    }else if(stat_name == "Guarda"){
        return [
            { name: "Guarda", mod: modifier, which: "current" },
            { name: "Guarda", mod: modifier, which: "max" }
        ];
    }else if(stat_name == "Resistência"){
        return [
            { name: "Resistência", mod: modifier, which: "current" },
            { name: "Guarda", mod: modifier, which: "max" }
        ];
    }else{
        return [{ name: stat_name, mod: modifier, which: "current" }];
    }
}

class GMNotesEditor{
    static create_gmnote_table(stats){
        let row_heads = "";
        let row_values = "";
        let bottom_msg = "<p>Suas notas aqui...</p>";
        
        for(let key in stats){
            row_heads += `<td><b>${key}</b></td>`;
            row_values += `<td>${stats[key]}</td>`;
        }
        
        let out = `<table class="userscript-table userscript-table-bordered" style="text-align: center"><tbody><tr>${row_heads}</tr><tr>${row_values}</tr></tbody></table>${bottom_msg}`;
        return out;
    }
    
    static get_stats_from_gmnotes(gmnotes){
        if(gmnotes.length == 0) return undefined;
        
        gmnotes = unescape(gmnotes);
        gmnotes = decodeURIComponent(gmnotes).split("</table>")[0];

        let value_reg = /<td>[^<>]*<\/td>/g;
        let key_reg = /<td><b>[^<>]*<\/b><\/td>/g;
        
        let match = undefined;
        let value_arr = [];
        let key_arr = [];

        while(match = value_reg.exec(gmnotes)) value_arr.push(match[0]);
        while(match = key_reg.exec(gmnotes)) key_arr.push(match[0]);

        value_arr = value_arr.map(x => x.replace("<td>", "").replace("</td>", "").trim());
        key_arr = key_arr.map(x => x.replace("<td><b>", "").replace("</b></td>", "").trim());
    
        if(value_arr.length == 0 || key_arr.length == 0){
            return undefined;   
        }else{
            let final_obj = {};
            for(let i = 0; i < value_arr.length; i++) final_obj[key_arr[i]] = value_arr[i];
            return final_obj;
        }
    }
    
    static edit_stats_from_gmnotes(gmnotes, stats){
        gmnotes = unescape(gmnotes);
        let table = decodeURI(gmnotes).split("</table>")[0];
        let post_table = decodeURI(gmnotes).split("</table>")[1];
        let old_stats = GMNotesEditor.get_stats_from_gmnotes(table);
        
        for(let key in old_stats)
            if (stats.hasOwnProperty(key)) old_stats[key] = stats[key];
        
        let new_table = GMNotesEditor.create_gmnote_table(old_stats).split("</table>")[0];
        return new_table + "</table>" + post_table;
    }
}

class StatusManager{
    static apply_status_effect(status_obj, undo=false){
        let character = getObj('character', status_obj.char_id);
        let stats_to_change = get_stats_influenced_by(status_obj.attr, status_obj.modifier);
        stats_to_change.forEach(stat => {
            create_attribute_if_not_exists(character.id, stat.name, 0);
            let curr_attr_val = parseInt(getAttrByName(character.id, stat.name, stat.which));
            
            if(undo){
                var new_attr_val = parseInt(curr_attr_val) - parseInt(stat.mod);
            }else{
                var new_attr_val = parseInt(curr_attr_val) + parseInt(stat.mod);
            }
            
            let attr_obj = findObjs({ _type: "attribute", name: stat.name, _characterid: character.id })[0];
            attr_obj.set(stat.which, new_attr_val);
        });
    }
    
    static add_debuff(char_id, debuff_name){
        let character = getObj('character', char_id);
        let debuff = undefined;
        if(debuff_name == "sangramento"){
            add_item_to_turn_order({
                id: "-1", pr: 1,
                custom: `Sangramento em ${character.get("name")}`,
                formula: "+1", debuff_name: debuff_name, char_id: char_id
            });
        }
    }
    
    static apply_debuff_effect(debuff_obj){
        if(debuff_obj.debuff_name == "sangramento"){
            let vida_attr = findObjs({ _type: "attribute", name: "Vida", _characterid: debuff_obj.char_id })[0];
            vida_attr.set("current", getAttrByName(debuff_obj.char_id, "Vida") - 5);
        }
    }
}

// ------------- PLAYER ITEM MANAGER -------------
let get_char_all_weapons = function(char_id){
    let all_tokens = findObjs({ _type: "graphic", _subtype: "token" });
    let all_weapons = [];
    all_tokens.forEach(e => {
        if(get_token_type(e) == "arma"){
            let weapon_info = GMNotesEditor.get_stats_from_gmnotes(e.get("gmnotes"));
            if(weapon_info && weapon_info.Owner == char_id){
                all_weapons.push({
                    "name": e.attributes.name,
                    "img": e.attributes.imgsrc,
                    "info": weapon_info,
                    "token": e
                });
            }
        }
    });
    
    return all_weapons;
}

let get_char_curr_weapon = function(char_id){
    let char_weapon = undefined;
    create_attribute_if_not_exists(char_id, "Id_Arma", "");
    let char_curr_weapon_id = getAttrByName(char_id, "Id_Arma");
    get_char_all_weapons(char_id).forEach(e => {
        if(e.info.Id == char_curr_weapon_id){
            char_weapon = e;
            return;
        }
    });
    return char_weapon;
}

let get_char_all_armors = function(char_id){
    let all_tokens = findObjs({ _type: "graphic", _subtype: "token" });
    let all_armors = [];
    all_tokens.forEach(e => {
        if(get_token_type(e) == "armadura"){
            let armor_info = GMNotesEditor.get_stats_from_gmnotes(e.get("gmnotes"));
            if(armor_info && armor_info.Owner == char_id){
                all_armors.push({
                    "name": e.attributes.name,
                    "img": e.attributes.imgsrc,
                    "info": armor_info,
                    "token": e
                });
            }
        }
    });
    
    return all_armors;
}

let get_char_curr_armor = function(char_id){
    let char_armor = undefined;
    create_attribute_if_not_exists(char_id, "Id_Armadura", "");
    let char_curr_armor_id = getAttrByName(char_id, "Id_Armadura");
    get_char_all_armors(char_id).forEach(e => {
        if(e.info.Id == char_curr_armor_id){
            char_armor = e;
            return;
        }
    });
    return char_armor;
}

// ------------- ROLL20 OBJECTS -------------
let get_token_type = function(token){
    let cid = token.get("represents");
    let all_char_attr = findObjs({ _type: "attribute", _characterid: cid });
    
    let possible_types = {
        "Is_Arma": "arma",
        "Is_Armadura": "armadura"
    };
    
    for(let key in possible_types){
        if(all_char_attr.filter(x => x.attributes.name == key).length > 0){
            return possible_types[key]; 
        }
    }
    
    return undefined;
}

let create_attribute_if_not_exists = function(char_id, attr_name, attr_curr, attr_max=""){
    if(char_id){
        let attr_obj = getAttrByName(char_id, attr_name);
        if(attr_obj == undefined){
            log("creating");
            createObj("attribute", {
                name: attr_name,
                current: attr_curr,
                max: attr_max,
                characterid: char_id
            });
        }
    }
}

let create_macro_in_character = function(char_id, name, action){
    let character = getObj("character", char_id);
    
    return createObj("ability", {
        _characterid: character.id,
        name: name,
        action: action,
        istokenaction: true
    });
}

let add_item_to_turn_order = function(new_item, front=false){
    let curr_turn_order = JSON.parse(Campaign().get("turnorder") || "[]");
        
    curr_turn_order = curr_turn_order.filter(x => x.custom != "Turnos")
    new_item["local_id"] = Math.floor(Math.random() * (Number.MAX_SAFE_INTEGER - 1)).toString(36);

    if(front){
        curr_turn_order.unshift(new_item);
    }else{
        curr_turn_order.push(new_item);
    }
    
    // curr_turn_order.push({ id: "-1", local_id: -1, pr: 0, custom: "Turnos", formula: "+1" });
    Campaign().set("turnorder", JSON.stringify(curr_turn_order));
    last_turn_order = JSON.stringify(curr_turn_order);
}

// ------------- LISTENERS -------------
let process_roll_dic = function(vantagem, callback){
    let done = false;
    on("chat:message", function(msg){
        if (done === false && msg.type == "rollresult"){
            done = true;
            let roll = JSON.parse(msg.content);
            let roll_ints = roll.rolls[0].results.map(x => x.v);
            
            if(vantagem != 0){
                let roll_msg = msg.origRoll;
                sendChat(msg.who, `/roll ${roll_msg}`);
                
                process_roll_dic(0, (new_msg, new_roll_ints) => {
                    let display =  `&{template:default}{{name=Escolha a rolagem}} {{Rolagem=[${roll_ints}](!choose_adv_roll 0) [${new_roll_ints}](!choose_adv_roll 1)}}`;
                    
                    if(vantagem == 1){
                        sendChat("API", `/w "${msg.who.replace(" (GM)", "")}" ${display}`);
                    }else{
                        sendChat("API", `/w gm ${display}`);
                    }
                    
                    let adv_done = false;
                    on("chat:message", function(msg){
                        if (msg.type == "api" && !adv_done){
                            adv_done = true;
                            if(msg.content.split(" ")[0] == "!choose_adv_roll"){
                                let args = msg.content.split(/\s+/);
                                
                                if(args[1] == "0"){
                                    callback(msg, roll_ints);
                                }else{
                                    callback(new_msg, new_roll_ints);
                                }
                            }
                        }
                    });
                });
            }else{
                callback(msg, roll_ints);
            }
        }
    });
}

on("chat:message", function(msg){
    if (msg.type == "api"){
        for(const key in commands){
            msg.content = msg.content.replace("  ", " ");
            if(msg.content.split(" ")[0] == key){
                log("Found command " + key);
                let args = msg.content.split(/\s+/);
                args.splice(0, 1);
                log(msg.content);
                commands[key](args, msg.who);
                break;
            }
        }
    }
});

on("change:campaign:turnorder", function() {
    let curr_turn_order = JSON.parse(Campaign().get("turnorder") || "[]");
    curr_turn_order = curr_turn_order.filter(x => x.custom != "Turnos");

    if(last_turn_order.length > 0){
        let last_turn_order_obj = JSON.parse(last_turn_order);
        
        let deleted_objs = [];
        last_turn_order_obj.forEach(e => {
            let found_obj = false;
            curr_turn_order.forEach(te => {
                if(e.local_id == te.local_id){
                    found_obj = true;
                    return;
                }    
            });
            
            if(!found_obj){
                deleted_objs.push(e);
            }
        });
        
        deleted_objs.forEach(e => {
            let is_eff = "char_id" in e;
            let is_debuff = "debuff_name" in e;
            
            if(!is_debuff && is_eff){
                StatusManager.apply_status_effect(e, undo=true);
            }
        });
    }
    
    for(let i = 0; i < curr_turn_order.length; i++){
        let is_eff = "char_id" in curr_turn_order[i];
        let is_debuff = "debuff_name" in curr_turn_order[i];
        
        // if(!is_debuff && is_eff && curr_turn_order[i].pr <= 0){
            // StatusManager.apply_status_effect(curr_turn_order[i], undo=true);
        // }
        
        if(i == 0 && is_debuff && is_eff){
            StatusManager.apply_debuff_effect(curr_turn_order[i]);
        }
        
        if(i == 0 && is_eff && curr_turn_order[i].attr == "Vida"){
            let character = getObj('character', curr_turn_order[i].char_id);
            let curr_vida = parseInt(getAttrByName(character.id, "Vida", "current"));
            let dano = parseInt(curr_turn_order[i].modifier);
            let attr_obj = findObjs({ _type: "attribute", name: "Vida", _characterid: character.id })[0];
            attr_obj.set("current", curr_vida + dano);
        }
    }
    
    let new_curr_turn_order = [];
    let eff_done = false;
    for(let i = 0; i < curr_turn_order.length; i++){
        let x = curr_turn_order[i];
        let is_eff = "char_id" in curr_turn_order[i];
        let is_debuff = "debuff_name" in curr_turn_order[i];
        
        if(x.id != "-1") eff_done = true;
        
        if(((!eff_done && x.pr >= 1) || eff_done) && ("attr" in x && x.pr > 0 || !("attr" in x) || is_debuff)){
            new_curr_turn_order.push(x);
        }else if(!is_debuff && is_eff && "attr" in x){
            StatusManager.apply_status_effect(curr_turn_order[i], undo=true);
        }
    }
    
    // curr_turn_order = curr_turn_order.filter(x => (x.pr > 0 || x.id != "-1" || x.custom == "Turnos"));
    // new_curr_turn_order.push({ id: "-1", pr: 0, custom: "Turnos", formula: "+1" });
    Campaign().set("turnorder", JSON.stringify(new_curr_turn_order));
    
    last_turn_order = JSON.stringify(new_curr_turn_order);
});
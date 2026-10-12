import type {GameState,PlayerId} from './types';
export function tableActionStatus(state:GameState,viewer:PlayerId,options:{spectator?:boolean;sending?:boolean;drawing?:boolean;selection?:boolean}={}){
 const active=state.activePlayerId;const mine=active===viewer&&!options.spectator;
 if(state.winner||state.phase==='finished')return {phase:'Finished',label:'Match ended',reason:'The match has ended.'};
 if(state.phase.startsWith('mulligan-'))return {phase:'Opening hand',label:options.spectator?'Watching mulligan':state.mulligan.completed[viewer]?'Waiting for opponent':'Choose your opening hand',reason:'Each ruler decides independently. Submitted hands wait for the other ruler.'};
 if(options.sending)return {phase:'Playing',label:'Submitting action',reason:'Waiting for the server to confirm your action.'};
 if(state.pendingEffect){const controller=state.pendingEffect.controllerId===viewer&&!options.spectator;return {phase:'Resolving effect',label:controller?'Resolve effect':'Waiting for effect',reason:controller?'Resolve the highlighted mandatory choice before another action or End Turn.':'The effect controller must resolve the mandatory choice.'};}
 if(!mine)return {phase:'Playing',label:options.spectator?'Watching':'Waiting for opponent',reason:options.spectator?'You may inspect cards; spectators cannot change the game.':'You may inspect cards while the opponent takes their ruler turn.'};
 if(options.drawing)return {phase:'Playing',label:'Drawing card',reason:'Wait for the turn draw to finish.'};
 if(options.selection)return {phase:'Playing',label:'Choose / confirm action',reason:'Use the highlighted legal targets or the selected card controls. Cancel to choose another action.'};
 return {phase:'Playing',label:'Your action',reason:'Play a legal card, initiate a legal conflict, or end your ruler turn.'};
}

import { CacheNomad } from 'cache-nomad';
import { IndexedDBAdapter } from 'cache-nomad/adapters';

export const nomad = new CacheNomad(new IndexedDBAdapter());

nomad.registerAction('SAVE_NOTE', async (payload) => {
  const response = await fetch('/api/notes', { 
    method: 'POST', 
    body: JSON.stringify(payload) 
  });
  if (!response.ok) throw new Error('Failed to save');
});

nomad.addInterceptor(async (action) => {
  const myToken = localStorage.getItem('my_jwt_token'); 
  
  if (myToken) {
    action.payload.token = myToken;
  }
  
  return action; 
});
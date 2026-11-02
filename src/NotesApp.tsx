import { useNomad } from './react';
import { nomad } from './nomad-setup';


const fetchNotes = async () => {
  const res = await fetch('/api/notes');
  return res.json();
};

export function NotesApp() {

  const { data: notes, mutate, isReady } = useNomad(nomad, 'notes-cache', fetchNotes);

  const handleAddNote = () => {
    const newNote = { id: Date.now(), text: 'New offline note!' };
    

    mutate(
      [...(notes || []), newNote], 
      'SAVE_NOTE',                 
      newNote                     
    );
  };

  if (!isReady) {
    return <div>Loading Storage Engine...</div>;
  }

  return (
    <div>
      <h2>My Notes</h2>
      <ul>
        {notes?.map((note: any) => (
          <li key={note.id}>{note.text}</li>
        ))}
      </ul>
      <button onClick={handleAddNote}>Add Note</button>
    </div>
  );
}
async function inspectSteps() {
  const res = await fetch('https://firestore.googleapis.com/v1/projects/authspark-pq68d/databases/(default)/documents/process_steps?key=AIzaSyCxwS4oCfB4b2vQniNoSjNOq_G_2GvAkdg');
  const data = await res.json();
  console.log('Total process_steps:', data.documents ? data.documents.length : 0);
  if (data.documents) {
    data.documents.forEach((d, i) => {
      const id = d.name.split('/').pop();
      const f = d.fields || {};
      const title = f.title?.stringValue || 'NO_TITLE';
      const img = f.image_url?.stringValue || 'NO_IMG';
      const num = f.step_number?.integerValue || 'NO_NUM';
      console.log(`[${i}] id=${id} | step=${num} | title=${title} | img=${img}`);
    });
  }
}
inspectSteps().catch(console.error);

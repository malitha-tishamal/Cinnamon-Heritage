async function inspectContent() {
  const res = await fetch('https://firestore.googleapis.com/v1/projects/authspark-pq68d/databases/(default)/documents/site_content?key=AIzaSyCxwS4oCfB4b2vQniNoSjNOq_G_2GvAkdg');
  const data = await res.json();
  console.log('Total site_content docs:', data.documents ? data.documents.length : 0);
  if (data.documents) {
    data.documents.forEach((d, i) => {
      const id = d.name.split('/').pop();
      const keys = Object.keys(d.fields || {});
      console.log(`[${i}] id=${id} | fields=${keys.join(', ')}`);
      // Print values for checking
      const sample = {};
      for (const k of keys) {
        const valObj = d.fields[k];
        sample[k] = valObj.stringValue || valObj.booleanValue || valObj.integerValue || valObj;
      }
      console.log('   data:', JSON.stringify(sample));
    });
  }
}
inspectContent().catch(console.error);

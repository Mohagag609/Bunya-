try {
  require('better-sqlite3');
  console.log('Successfully required better-sqlite3');
} catch (e) {
  console.error('Failed to require better-sqlite3');
  console.error(e);
  process.exit(1);
}

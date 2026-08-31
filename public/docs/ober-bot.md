### Why I created this?

I am usually the kind of person that is terrible at making/maintaining spotify playlists. So I thought what if I have an AI that can manage everything for me instead of using my friends playlists. That is the motivation behind this vibe coded project

### commands

- /playlist create (prompt): creates a playlist based on a human language prompt.
- /playlist extend (playlist url, count): extends the playlist based on the songs that are already in it with count being the amount to add.
- /playlist split (playlist url, count): splits the playlist in "count" amount of playlists based on genre.
- /playlist similar (playlist url): creates a playlist with the same genre but different songs
- /playlist status: checks how many times I am still allowed to call the spotify API (has a buffer).

The last command is because spotify dev apps have a limited amount of API calls and that way I can check if I am running out.
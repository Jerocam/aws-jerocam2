import './App.css';
import React, { useState, useEffect } from 'react';
import Amplify from 'aws-amplify';
import config from './aws-exports';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { API, Storage } from 'aws-amplify';
import { listNotes } from './graphql/queries';
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation } from './graphql/mutations';
import { Button, Container, Grid, TextField, Card, CardActionArea, CardContent, CardMedia, CardActions, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

Amplify.configure(config);

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    padding: '1em',
  },
  paper: {
    padding: theme.spacing(3),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
  root2: {
    padding: '2em'
  },
}));

const initialFormState = { name: '', description: '' }

function App () {

  const classes = useStyles();
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(notesFromAPI.map(async note => {
      if (note.image) {
        const image = await Storage.get(note.image);
        note.image = image;
      }
      return note;
    }))
    setNotes(apiData.data.listNotes.items);
  }

  async function createNote() {
    if (!formData.name || !formData.description) return;
    await API.graphql({ query: createNoteMutation, variables: { input: formData } });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setNotes([ ...notes, formData ]);
    setFormData(initialFormState);
  }

  async function deleteNote({ id }) {
    const newNotesArray = notes.filter(note => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});
  }

  async function onChange(e) {
    if (!e.target.files[0]) return
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchNotes();
  }

  return (
    <div className="App">
      <Container>
        <h1>AWS Jerocam App</h1>
        
          <form noValidate autoComplete="off">
            <Grid container className={classes.root}>
                <Grid container justify="center" spacing={3}>
                  <Grid item>
                    <TextField onChange={e => setFormData({ ...formData, 'name': e.target.value})} value={formData.name} label="Title" />
                  </Grid>
                  <Grid item>
                    <TextField onChange={e => setFormData({ ...formData, 'description': e.target.value})} value={formData.description} label="Author" />
                  </Grid>
                  <Grid item>
                    <Button component="label" variant="contained" color="default">Upload file <input type="file" hidden onChange={onChange}/></Button>
                  </Grid>
                  <Grid item>
                    <Button color="secondary" variant="contained" onClick={createNote}>Create Manga</Button>
                  </Grid>
                </Grid>
              </Grid>
          </form>

        <div className={classes.root}>
          <Grid container spacing={2}>
          {notes.map((data, key)=>(
            <Grid key={key} item xs={6} sm={3}>
              <Card className={classes.paper}>
                <CardActionArea>
                  <CardMedia
                    style={{height:400}}
                    image={data.image}
                    title={data.name}
                  />
                  <CardContent>
                    <Typography gutterBottom variant="h5">
                      {data.name}
                    </Typography>
                    <Typography color="textSecondary" variant="h6">
                      {data.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
                <CardActions>
                  <Button variant={'contained'} color="secondary" onClick={() => deleteNote(data)}>
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
          </Grid>
        </div>
        
        <div className={classes.root2}>
          <AmplifySignOut />
        </div>
        

      </Container>
    </div>
  )
}


export default withAuthenticator(App);


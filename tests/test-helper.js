import { setApplication } from '@ember/test-helpers';
import { start } from 'ember-mocha';
import { application } from './helpers/resolver';

setApplication(application);
start();

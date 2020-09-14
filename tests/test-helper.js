import { setApplication } from '@ember/test-helpers';
import { start } from 'ember-mocha';

import Application from '../app';
import config from '../config/environment';

setApplication(Application.create(config.APP));
start();

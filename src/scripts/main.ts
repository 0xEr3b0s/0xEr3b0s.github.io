import { safely } from './dom';
import { startClock } from './clock';
import { initStartMenu } from './startmenu';
import { initCopy } from './copy';
import { initFilters } from './filters';
import { initDesktop } from './wm/init';

safely(startClock);
safely(initStartMenu);
safely(initFilters);
safely(initCopy);
safely(initDesktop);

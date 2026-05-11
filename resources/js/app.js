import './bootstrap';
import Alpine from 'alpinejs';
import chatComponent from './chat';

window.Alpine = Alpine;
Alpine.data('chat', chatComponent);
Alpine.start();

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {

  contactItems = [
    {
      icon: 'fa-solid fa-envelope',
      label: 'Email',
      value: 'info@intertoto.rs',
      href: 'mailto:info@intertoto.rs'
    },
    {
      icon: 'fa-solid fa-phone',
      label: 'Telefon',
      value: '+381 60 000 0000',
      href: 'tel:+381600000000'
    },
    {
      icon: 'fa-solid fa-location-dot',
      label: 'Lokacija',
      value: 'Vukasovićeva 21a, Kanarevo brdo',
      href: null
    }
  ];

  socialLinks = [
    {
      icon: 'fa-brands fa-instagram',
      name: 'Instagram',
      description: 'Pratite najnovije objave',
      href: 'https://www.instagram.com/intertoto_liga/'
    },
    {
      icon: 'fa-solid fa-envelope',
      name: 'Email',
      description: 'Pošaljite nam poruku',
      href: 'mailto:info@intertoto.rs'
    }
  ];

}
# Shelf

![License](https://img.shields.io/badge/license-MIT-blue.svg) [![Latest Stable Version](https://img.shields.io/packagist/v/ernestdefoe/shelf.svg)](https://packagist.org/packages/ernestdefoe/shelf)

A [Flarum 2](https://flarum.org) companion to [Marquee](https://github.com/ernestdefoe/marquee). Every movie, TV show, game, album and book Marquee links becomes something members can rate, log and list: half-star ratings, a "watched / read / played / listened" log with dates, a want-to list, and public lists in their own order. Profiles get a Shelf tab, and the forum gets a top-rated view.

![Rating and shelving from a Marquee card](https://raw.githubusercontent.com/ernestdefoe/shelf/main/.github/screenshots/card.jpg)

## Features

- **Rate from the card.** Every Marquee card gets the members' average, your own stars (half stars, by pointer, touch or keyboard) and an **Add to shelf** menu.
- **Log it with a date.** Mark a title as watched, read, played or listened, on today or any earlier date, or as one you want to get to. The words follow the kind of title.
- **Your collection.** Mark the titles you own (the games on your shelf, the box sets, the books) with **In my collection**, on its own or alongside a rating. The Shelf tab has a Collection filter, so a member's collection is one click from their profile.
- **Public lists.** Put titles on lists such as "Best of the decade", straight from the card or by starting a new list there. Each list has its own page; its owner drags titles into order, removes them, renames or deletes it.
- **A Shelf tab on every profile.** The member's lists, then everything they rated or logged, filterable by rated, logged and want-to.
- **Top rated.** `/shelf` (linked from the forum's sidebar) lists the best-rated titles this month, this year or ever, by kind. A title needs a minimum number of ratings in the period (two by default, set in the admin panel), so one member's five stars can't top it.
- **A widget, if you use one.** The top-rated list is offered to [Bespoke](https://github.com/ernestdefoe/bespoke) and to [FoF Forum Widgets](https://github.com/FriendsOfFlarum/forum-widgets-core). Neither is needed: the page and its sidebar link are always there.
- **Translatable.** Every word on screen comes from the language files.

![A member's Shelf tab](https://raw.githubusercontent.com/ernestdefoe/shelf/main/.github/screenshots/profile.jpg)

![A public list](https://raw.githubusercontent.com/ernestdefoe/shelf/main/.github/screenshots/list.jpg)

![Top rated this month](https://raw.githubusercontent.com/ernestdefoe/shelf/main/.github/screenshots/top-rated.jpg)

## Installation

```sh
composer require ernestdefoe/shelf
php flarum migrate
```

Enable **Marquee** first, then **Shelf**.

## Permissions

| Permission | Default | What it allows |
|---|---|---|
| Rate, log and list titles on their shelf | Members | Ratings, the log, the want-to list and lists |
| Delete anyone's shelf lists | Moderators | Removing a list that shouldn't be there |

Shelves and lists are public to anyone who can see the member's profile.

## Good to know

- **Lean on every page.** The discussion list costs nothing extra: the members' average and your own entry travel only with the discussion page's card. A shelf page loads every title and the discussion each one links to in a fixed number of queries, however many titles it shows. The top-rated list is worked out once every ten minutes and shared by everyone.
- **Titles link to their discussions.** A title on a shelf, a list or the top-rated page links to the busiest discussion about it the viewer is allowed to see, or to nothing.
- **What can be rated.** Any title Marquee has stored, which is every title someone has linked a discussion to.
- **Lists are capped** at 50 per member and 500 titles per list.

## Updating

```sh
composer update ernestdefoe/shelf
php flarum migrate
php flarum cache:clear
```

## Links

- [Packagist](https://packagist.org/packages/ernestdefoe/shelf)
- [GitHub](https://github.com/ernestdefoe/shelf)
- [Marquee](https://github.com/ernestdefoe/marquee)

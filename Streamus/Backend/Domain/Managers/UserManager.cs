﻿using System;
using System.Reflection;
using Streamus.Backend.Dao;
using Streamus.Backend.Domain.DataInterfaces;
using log4net;

namespace Streamus.Backend.Domain.Managers
{
    /// <summary>
    ///     Provides a common spot for methods against Users which require transactions (Creating, Updating, Deleting)
    /// </summary>
    public class UserManager
    {
        private static readonly ILog Logger = LogManager.GetLogger(MethodBase.GetCurrentMethod().DeclaringType);
        private IUserDao UserDao { get; set; }
        private IPlaylistDao PlaylistDao { get; set; }

        public UserManager(IUserDao userDao, IPlaylistDao playlistDao)
        {
            UserDao = userDao;
            PlaylistDao = playlistDao;
        }

        /// <summary>
        ///     Creates a new User and saves it to the DB. As a side effect, also creates a new, empty Playlist
        ///     for the created User and saves it to the DB.
        /// </summary>
        /// <returns>The created user with a generated GUID</returns>
        public User CreateUser()
        {
            User user;
            try
            {
                NHibernateSessionManager.Instance.BeginTransaction();
                user = new User();
                user.ValidateAndThrow();
                UserDao.SaveOrUpdate(user);

                //Create a brand new, empty playlist for the user.
                var playlist = new Playlist(user.Id, "New Playlist");
                PlaylistDao.SaveOrUpdate(playlist);

                NHibernateSessionManager.Instance.CommitTransaction();
            }
            catch (Exception exception)
            {
                Logger.Error(exception);
                throw;
            }

            return user;
        }

        /// <summary>
        ///     Saves a user to the database -- cr
        /// </summary>
        /// <param name="user"></param>
        public void SaveUser(User user)
        {
            try
            {
                NHibernateSessionManager.Instance.BeginTransaction();
                user.ValidateAndThrow();
                UserDao.SaveOrUpdate(user);
                NHibernateSessionManager.Instance.CommitTransaction();
            }
            catch (Exception exception)
            {
                Logger.Error(exception);
                throw;
            }
        }
    }
}
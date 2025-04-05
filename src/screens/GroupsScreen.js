import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, FAB, TextInput, Portal, Modal, List, Chip, IconButton, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import { useGroups } from '../hooks/useGroups';
import { useAuth } from '../hooks/useAuth';
import { LogoIcon } from '../components/LogoIcon';
import { supabase } from '../services/supabase';
import { useFocusEffect } from '@react-navigation/native';

export const GroupsScreen = () => {
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groupName, setGroupName] = useState('');
    const [memberEmail, setMemberEmail] = useState('');
    const [memberEmails, setMemberEmails] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [addType, setAddType] = useState('existing'); // 'existing' or 'manual'
    const [memberName, setMemberName] = useState('');
    const [pendingMembers, setPendingMembers] = useState([]); // Track members before group creation

    const { groups, loading: groupsLoading, error: groupsError, createGroup, addMember, removeMember, deleteGroup, refreshGroups } = useGroups();

    useFocusEffect(
        useCallback(() => {
            refreshGroups();
        }, [])
    );

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            setError('Group name is required');
            return;
        }

        if (pendingMembers.length === 0) {
            setError('Add at least one member');
            return;
        }

        try {
            setLoading(true);
            setError('');
            await createGroup(groupName, pendingMembers);
            setCreateModalVisible(false);
            setGroupName('');
            setPendingMembers([]);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async () => {
        if (!memberEmail.trim()) {
            setError('Email is required');
            return;
        }

        try {
            setLoading(true);
            setError('');
            await addMember(selectedGroup.id, memberEmail);
            setAddMemberModalVisible(false);
            setMemberEmail('');
            setSelectedGroup(null);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async (groupId, userId) => {
        try {
            await removeMember(groupId, userId);
        } catch (error) {
            setError(error.message);
        }
    };

    const handleDeleteGroup = async (groupId) => {
        try {
            await deleteGroup(groupId);
        } catch (error) {
            setError(error.message);
        }
    };

    const handleAddPendingMember = async () => {
        try {
            setLoading(true);
            setError('');

            if (addType === 'existing') {
                if (!memberEmail.trim()) {
                    throw new Error('Email is required');
                }

                // Check if user exists
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('id, email, full_name')
                    .eq('email', memberEmail)
                    .single();

                if (userError || !userData) {
                    throw new Error('User not found');
                }

                setPendingMembers([...pendingMembers, {
                    id: userData.id,
                    email: userData.email,
                    full_name: userData.full_name,
                    isRegistered: true
                }]);
            } else {
                if (!memberName.trim()) {
                    throw new Error('Name is required');
                }

                // Create a temporary ID for manual friend
                const tempId = 'manual_' + Date.now();
                setPendingMembers([...pendingMembers, {
                    id: tempId,
                    full_name: memberName.trim(),
                    isRegistered: false
                }]);
            }

            // Clear inputs
            setMemberEmail('');
            setMemberName('');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (groupsLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#42B095" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.logoContainer}>
                    <LogoIcon />
                </View>
                <Text variant="headlineMedium" style={styles.headerText}>Groups</Text>

                {groupsError ? (
                    <Text style={styles.error}>{groupsError}</Text>
                ) : null}

                {groups.map((group) => (
                    <Card key={group.id} style={styles.groupCard}>
                        <Card.Content>
                            <View style={styles.groupHeader}>
                                <Text variant="titleLarge" style={styles.groupTitle}>{group.name}</Text>
                                {group.isOwner && (
                                    <IconButton
                                        icon="delete"
                                        iconColor="#424242"
                                        onPress={() => handleDeleteGroup(group.id)}
                                    />
                                )}
                            </View>
                            <Text variant="bodySmall" style={styles.memberCount}>
                                {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                            </Text>
                            <View style={styles.membersContainer}>
                                {group.members.map((member) => (
                                    <Chip
                                        key={member.id}
                                        style={styles.memberChip}
                                        textStyle={styles.memberChipText}
                                        onClose={group.isOwner ? () => handleRemoveMember(group.id, member.id) : undefined}
                                    >
                                        {member.full_name}
                                    </Chip>
                                ))}
                            </View>
                            {group.isOwner && (
                                <Button
                                    mode="outlined"
                                    onPress={() => {
                                        setSelectedGroup(group);
                                        setAddMemberModalVisible(true);
                                    }}
                                    style={styles.addMemberButton}
                                    textColor="#424242"
                                    buttonColor="#F5F5F5"
                                >
                                    Add Member
                                </Button>
                            )}
                        </Card.Content>
                    </Card>
                ))}
            </ScrollView>

            {/* Create Group Modal */}
            <Portal>
                <Modal
                    visible={createModalVisible}
                    onDismiss={() => {
                        setCreateModalVisible(false);
                        setGroupName('');
                        setPendingMembers([]);
                    }}
                    contentContainerStyle={styles.modal}
                >
                    <ScrollView>
                        <Text variant="titleLarge" style={styles.modalTitle}>Create Group</Text>
                        {error ? <Text style={styles.error}>{error}</Text> : null}

                        <TextInput
                            label="Group Name"
                            value={groupName}
                            onChangeText={setGroupName}
                            mode="outlined"
                            style={styles.input}
                            outlineColor="#424242"
                            activeOutlineColor="#42B095"
                        />

                        <SegmentedButtons
                            value={addType}
                            onValueChange={setAddType}
                            buttons={[
                                { value: 'existing', label: 'Existing User' },
                                { value: 'manual', label: 'Manual Entry' }
                            ]}
                            style={styles.addTypeButtons}
                            theme={{
                                colors: {
                                    secondaryContainer: '#E8F5E9',
                                    onSecondaryContainer: '#424242',
                                    primary: '#42B095',
                                }
                            }}
                        />

                        {addType === 'existing' ? (
                            <TextInput
                                label="Member Email"
                                value={memberEmail}
                                onChangeText={setMemberEmail}
                                mode="outlined"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                style={styles.input}
                                outlineColor="#424242"
                                activeOutlineColor="#42B095"
                            />
                        ) : (
                            <TextInput
                                label="Member Name"
                                value={memberName}
                                onChangeText={setMemberName}
                                mode="outlined"
                                style={styles.input}
                                outlineColor="#424242"
                                activeOutlineColor="#42B095"
                            />
                        )}

                        <Button
                            mode="outlined"
                            onPress={handleAddPendingMember}
                            style={styles.addMemberButton}
                            textColor="#42B095"
                        >
                            Add Member
                        </Button>

                        {pendingMembers.length > 0 && (
                            <View style={styles.pendingMembersContainer}>
                                <Text variant="bodyMedium" style={styles.sectionSubtitle}>Members to add:</Text>
                                {pendingMembers.map((member) => (
                                    <Chip
                                        key={member.id}
                                        onClose={() => setPendingMembers(pendingMembers.filter(m => m.id !== member.id))}
                                        style={styles.memberChip}
                                    >
                                        {member.full_name} {member.isRegistered ? `(${member.email})` : ''}
                                    </Chip>
                                ))}
                            </View>
                        )}

                        <Button
                            mode="contained"
                            onPress={handleCreateGroup}
                            loading={loading}
                            style={styles.modalButton}
                            buttonColor="#42B095"
                            textColor="white"
                        >
                            Create Group
                        </Button>
                        <Button
                            onPress={() => {
                                setCreateModalVisible(false);
                                setGroupName('');
                                setPendingMembers([]);
                            }}
                            textColor="#424242"
                        >
                            Cancel
                        </Button>
                    </ScrollView>
                </Modal>
            </Portal>

            {/* Add Member Modal */}
            <Portal>
                <Modal
                    visible={addMemberModalVisible}
                    onDismiss={() => setAddMemberModalVisible(false)}
                    contentContainerStyle={styles.modal}
                >
                    <Text variant="titleLarge" style={styles.modalTitle}>Add Member</Text>
                    {error ? <Text style={styles.error}>{error}</Text> : null}
                    <TextInput
                        label="Email"
                        value={memberEmail}
                        onChangeText={setMemberEmail}
                        mode="outlined"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.input}
                        outlineColor="#424242"
                        activeOutlineColor="#42B095"
                    />
                    <Button
                        mode="contained"
                        onPress={handleAddMember}
                        loading={loading}
                        style={styles.modalButton}
                        buttonColor="#42B095"
                        textColor="white"
                    >
                        Add Member
                    </Button>
                    <Button
                        onPress={() => setAddMemberModalVisible(false)}
                        textColor="#424242"
                    >
                        Cancel
                    </Button>
                </Modal>
            </Portal>

            {/* FAB for creating groups */}
            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => setCreateModalVisible(true)}
                label="Add Group"
                color="#42B095"
                theme={{ colors: { surface: 'white' } }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#42B095', // Mint green background
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    logoContainer: {
        alignSelf: 'flex-start',
        marginTop: 40,
        marginLeft: 20,
    },
    headerText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '600',
        marginBottom: 20,
        textAlign: 'center',
    },
    groupCard: {
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
        elevation: 2,
        borderRadius: 12,
    },
    groupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    groupTitle: {
        color: '#424242', // Dark grey
    },
    memberCount: {
        color: '#424242', // Dark grey
    },
    membersContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    memberChip: {
        margin: 4,
        backgroundColor: '#E8F5E9',
    },
    memberChipText: {
        color: '#424242', // Dark grey text
    },
    addMemberButton: {
        marginBottom: 20,
        borderColor: '#42B095',
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        backgroundColor: 'white',
        borderColor: '#42B095',
        borderWidth: 1,
    },
    modal: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 12,
    },
    modalTitle: {
        marginBottom: 20,
        textAlign: 'center',
        color: '#424242',
        fontSize: 20,
        fontWeight: '600',
    },
    input: {
        marginBottom: 20,
    },
    modalButton: {
        marginBottom: 12,
        borderRadius: 8,
    },
    error: {
        color: '#B00020',
        marginBottom: 12,
        textAlign: 'center',
    },
    emailChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    chip: {
        margin: 4,
        backgroundColor: '#E8F5E9',
    },
    loadingContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)'
    },
    addTypeButtons: {
        marginBottom: 20,
    },
    pendingMembersContainer: {
        marginBottom: 20,
    },
    sectionSubtitle: {
        color: '#424242',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
}); 